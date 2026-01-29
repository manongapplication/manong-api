import {
  BadGatewayException,
  forwardRef,
  Inject,
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
import { UpdateManongWalletTransactionDto } from 'src/manong-wallet-transaction/dto/update-manong-wallet-transaction.dto';

@Injectable()
export class ManongWalletService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PaymongoService))
    private readonly paymongoService: PaymongoService,
    @Inject(forwardRef(() => ManongWalletTransactionService))
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

  // Add to specific field
  async addToBalance(manongId: number, amount: number) {
    if (amount === 0) {
      return this.prisma.manongWallet.findUnique({ where: { manongId } });
    }

    return this.prisma.manongWallet.update({
      where: { manongId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }

  async addToPending(manongId: number, amount: number) {
    if (amount === 0) {
      return this.prisma.manongWallet.findUnique({ where: { manongId } });
    }

    return this.prisma.manongWallet.update({
      where: { manongId },
      data: {
        pending: {
          increment: amount,
        },
      },
    });
  }

  async addToLocked(manongId: number, amount: number) {
    if (amount === 0) {
      return this.prisma.manongWallet.findUnique({ where: { manongId } });
    }

    return this.prisma.manongWallet.update({
      where: { manongId },
      data: {
        locked: {
          increment: amount,
        },
      },
    });
  }

  // Combined method
  async addAmounts(
    manongId: number,
    amounts: {
      balance?: number;
      pending?: number;
      locked?: number;
    },
  ) {
    const updateData: any = {};

    if (amounts.balance !== undefined && amounts.balance !== 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.balance = { increment: amounts.balance };
    }

    if (amounts.pending !== undefined && amounts.pending !== 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.pending = { increment: amounts.pending };
    }

    if (amounts.locked !== undefined && amounts.locked !== 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.locked = { increment: amounts.locked };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (Object.keys(updateData).length === 0) {
      return this.prisma.manongWallet.findUnique({ where: { manongId } });
    }

    return this.prisma.manongWallet.update({
      where: { manongId },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: updateData,
    });
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

    const initialMetadata = {
      provider,
    };

    const transactionDto: CreateManongWalletTransactionDto = {
      walletId: wallet.id,
      type: WalletTransactionType.topup,
      status: WalletTransactionStatus.pending,
      amount,
      currency: currency ?? 'PHP',
      metadata: JSON.stringify(initialMetadata),
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const metadata: any = JSON.parse(transaction.metadata!);

    const updatedTransactionDto: UpdateManongWalletTransactionDto = {
      status: mapPaymongoStatusForWallet(paymentStatus),
      metadata: JSON.stringify({
        ...metadata,
        paymentRedirectUrl:
          result.data.attributes.next_action?.redirect?.url ?? null,
      }),
    };

    const updatedTransaction =
      await this.manongWalletTransactionService.updateWalletTransactionById(
        transaction.id,
        updatedTransactionDto,
      );

    return updatedTransaction;
  }
}
