import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateManongWalletDto } from './dto/create-manong-wallet.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateManongWalletDto } from './dto/update-manong-wallet.dto';
import { CreatePaymentIntentDto } from 'src/paymongo/dto/create-payment-intent.dto';
import { CreateCashInManongWallet } from './dto/create-cash-in-manong-wallet.dto';
import { PaymongoService } from 'src/paymongo/paymongo.service';
import { ManongWalletTransactionService } from 'src/manong-wallet-transaction/manong-wallet-transaction.service';
import { CreateManongWalletTransactionDto } from 'src/manong-wallet-transaction/dto/create-manong-wallet-transaction.dto';
import { WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { mapPaymongoStatusForWallet } from 'src/common/utils/payment.util';

@Injectable()
export class ManongWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymongoService: PaymongoService,
    private readonly manongWalletTransactionService: ManongWalletTransactionService,
  ) {}

  private readonly logger = new Logger(ManongWalletService.name);

  async fetchManongWallet(manongId: number) {
    const wallet = await this.prisma.manongWallet.findUnique({
      where: {
        manongId,
      },
    });

    if (!wallet) {
      throw new BadGatewayException('Wallet not found!');
    }

    return wallet;
  }

  async createManongWallet(manongId: number, dto: CreateManongWalletDto) {
    const wallet = await this.prisma.manongWallet.create({
      data: {
        manongId,
        currency: dto?.currency ?? 'PHP',
      },
    });

    return wallet;
  }

  async updateManongWallet(manongId: number, dto: UpdateManongWalletDto) {
    const wallet = await this.prisma.manongWallet.update({
      where: {
        manongId,
      },
      data: {
        balance: dto.balance,
        pending: dto.pending,
        locked: dto.locked,
      },
    });

    return wallet;
  }

  async cashInWallet(manongId: number, dto: CreateCashInManongWallet) {
    const { amount, provider, currency } = dto;
    const intentDto: CreatePaymentIntentDto = {
      amount: amount,
      currency: currency ?? 'PHP',
      capture_type: 'automatic',
      description: '',
      provider,
    };

    const wallet = await this.fetchManongWallet(manongId);

    if (!wallet) {
      throw new NotFoundException('Manong wallet not found!');
    }

    const metadata = {
      provider,
    };

    const transactionDto: CreateManongWalletTransactionDto = {
      walletId: wallet.id,
      type: WalletTransactionType.topup,
      status: WalletTransactionStatus.pending,
      amount,
      currency: currency ?? 'PHP',
      metadata: JSON.stringify(metadata),
    };

    const transaction =
      await this.manongWalletTransactionService.createManongWalletTransaction(
        transactionDto,
      );

    const result = await this.paymongoService.createPaymentManually(
      manongId,
      intentDto,
      transaction.id,
    );

    let paymentStatus: string;

    if (result.data.attributes.payments.length > 0) {
      paymentStatus = result.data.attributes.payments[0].attributes.status;
    } else {
      paymentStatus = result.data.attributes.status;
    }

    await this.manongWalletTransactionService.updateWalletTransactionById(
      transaction.id,
      {
        status: mapPaymongoStatusForWallet(paymentStatus),
      },
    );

    await this.updateManongWallet(manongId, {
      balance: amount,
    });

    return transaction;
  }
}
