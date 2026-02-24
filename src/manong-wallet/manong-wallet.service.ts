import {
  BadGatewayException,
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
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
import { CreateCashOutManongWallet } from './dto/create-cash-out-manong-wallet.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ManongWalletService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PaymongoService))
    private readonly paymongoService: PaymongoService,
    @Inject(forwardRef(() => ManongWalletTransactionService))
    private readonly manongWalletTransactionService: ManongWalletTransactionService,
    private readonly userService: UserService,
  ) {}

  private readonly logger = new Logger(ManongWalletService.name);

  async findByManongId(manongId: number) {
    return await this.prisma.manongWallet.findUnique({
      where: { manongId },
    });
  }

  async fetchByWalletId(walletId: number) {
    const wallet = await this.prisma.manongWallet.findUnique({
      where: {
        id: walletId,
      },
    });

    if (!wallet) {
      throw new BadGatewayException('Wallet not found!');
    }

    return wallet;
  }

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
    const manong = await this.userService.isManong(manongId);

    if (!manong) {
      throw new BadGatewayException('User is not manong!');
    }
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

  async updateAmounts(
    manongId: number,
    amounts: {
      balance?: number;
      pending?: number;
      locked?: number;
    },
    transaction?: {
      type: WalletTransactionType;
      status: WalletTransactionStatus;
      amount: number;
    },
  ) {
    const updateData: Record<string, any> = {};

    // Check for negative balance updates
    for (const key of ['balance', 'pending', 'locked'] as const) {
      const value = amounts[key];
      if (value && value !== 0) {
        if (value < 0) {
          // For negative amounts, we need to check current balance
          const currentWallet = await this.prisma.manongWallet.findUnique({
            where: { manongId },
          });

          if (!currentWallet) {
            throw new Error(`Wallet not found for manongId: ${manongId}`);
          }

          const currentValue = Number(currentWallet[key]);

          const newValue: number = Number(currentValue) + value; // value is negative, so this subtracts

          if (newValue < 0) {
            throw new BadGatewayException(
              `Insufficient ${key}. Current: ${currentValue}, Attempted to deduct: ${-value}, Result would be: ${newValue}`,
            );
          }
        }

        updateData[key] =
          value > 0 ? { increment: value } : { decrement: -value };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return this.prisma.manongWallet.findUnique({ where: { manongId } });
    }

    const wallet = await this.prisma.manongWallet.update({
      where: { manongId },
      data: updateData,
    });

    if (transaction != null) {
      await this.prisma.manongWalletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
        },
      });
    }

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

    const MINIMUM_CASH_IN_AMOUNT = 100;
    if (amount < MINIMUM_CASH_IN_AMOUNT) {
      throw new BadRequestException(
        `Minimum cash in amount is ₱${MINIMUM_CASH_IN_AMOUNT.toFixed(2)}`,
      );
    }

    const wallet = await this.fetchManongWallet(manongId);

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

  async cashOutWallet(manongId: number, dto: CreateCashOutManongWallet) {
    const {
      amount,
      bankCode,
      bankName,
      currency,
      accountName,
      accountNumber,
      notes,
    } = dto;

    const MINIMUM_AMOUNT = 100;
    if (amount < MINIMUM_AMOUNT) {
      throw new BadRequestException(
        `Minimum cash out amount is ₱${MINIMUM_AMOUNT.toFixed(2)}`,
      );
    }

    const wallet = await this.fetchManongWallet(manongId);

    await this.updateAmounts(manongId, {
      balance: -amount,
      pending: amount,
    });

    const initialMetadata = {
      bankCode,
      bankName,
      accountName,
      accountNumber,
      notes,
    };

    const transactionDto: CreateManongWalletTransactionDto = {
      walletId: wallet.id,
      type: WalletTransactionType.payout,
      status: WalletTransactionStatus.pending,
      amount,
      currency: currency ?? 'PHP',
      metadata: JSON.stringify(initialMetadata),
    };

    const transaction =
      await this.manongWalletTransactionService.createManongWalletTransaction(
        transactionDto,
      );

    return transaction;
  }

  calculateCashBookingReadiness(
    walletBalance: number,
    minRequiredForCashJob: number,
  ) {
    const shortfall = Math.max(minRequiredForCashJob - walletBalance, 0);
    const progressPercent = Math.min(
      Math.floor((walletBalance / minRequiredForCashJob) * 100),
      100,
    );

    const status =
      walletBalance === 0
        ? 'empty'
        : walletBalance < minRequiredForCashJob
          ? 'low'
          : 'ready';

    const message =
      status === 'empty'
        ? 'Your wallet has no balance. Add funds to start accepting cash bookings.'
        : status === 'low'
          ? `Add ₱${shortfall.toFixed(0)} more to accept most cash bookings.`
          : 'You’re ready to accept cash bookings.';

    return {
      balance: walletBalance,
      minimumRequired: minRequiredForCashJob,
      progressPercent,
      shortfall,
      status,
      message,
    };
  }

  async fetchCashBookingReadiness(manongId: number) {
    const wallet = await this.fetchManongWallet(manongId);

    const TYPICAL_CASH_JOB_AMOUNT = 666.67;
    const SERVICE_FEE_RATE = 0.15;

    const MIN_REQUIRED_FOR_CASH_JOB =
      TYPICAL_CASH_JOB_AMOUNT * SERVICE_FEE_RATE; // ₱45

    return this.calculateCashBookingReadiness(
      Number(wallet.balance),
      MIN_REQUIRED_FOR_CASH_JOB,
    );
  }
}
