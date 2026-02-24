import {
  BadGatewayException,
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateManongWalletTransactionDto } from './dto/create-manong-wallet-transaction.dto';
import { UpdateManongWalletTransactionDto } from './dto/update-manong-wallet-transaction.dto';
import { ManongWalletService } from 'src/manong-wallet/manong-wallet.service';
import { WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { PayJobFeesDto } from './dto/pay-job-fees.dto';
import { PaymongoService } from 'src/paymongo/paymongo.service';
import { CreatePaymentIntentDto } from 'src/paymongo/dto/create-payment-intent.dto';

@Injectable()
export class ManongWalletTransactionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ManongWalletService))
    private readonly manongWalletService: ManongWalletService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => PaymongoService))
    private readonly paymongoService: PaymongoService,
  ) {}

  async createManongWalletTransaction(dto: CreateManongWalletTransactionDto) {
    const transaction = await this.prisma.manongWalletTransaction.create({
      data: {
        walletId: dto.walletId,
        type: dto.type,
        status: dto.status,
        amount: dto.amount,
        currency: dto.currency,
        description: dto.description,
        metadata: dto.metadata,
      },
    });

    return transaction;
  }

  async findById(id: number) {
    const transaction = await this.prisma.manongWalletTransaction.findUnique({
      where: { id },
    });

    return transaction;
  }

  async findByIdIncludesWallet(id: number) {
    const transaction = await this.prisma.manongWalletTransaction.findUnique({
      where: { id },
      include: {
        wallet: true,
      },
    });

    return transaction;
  }

  async fetchWalletTransactionsByWalletId(
    walletId: number,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      this.prisma.manongWalletTransaction.findMany({
        where: {
          walletId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.manongWalletTransaction.count({
        where: {
          walletId,
        },
      }),
    ]);

    return {
      transactions,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async updateWalletTransactionById(
    id: number,
    dto: UpdateManongWalletTransactionDto,
  ) {
    const transaction = await this.prisma.manongWalletTransaction.update({
      where: { id },
      data: {
        status: dto.status,
        amount: dto.amount,
        metadata: dto.metadata,
      },
    });

    return transaction;
  }

  async addToWallet(id: number, dto: UpdateManongWalletTransactionDto) {
    const transaction = await this.prisma.manongWalletTransaction.update({
      where: { id },
      data: {
        status: dto.status,
        amount: dto.amount,
        metadata: dto.metadata,
      },
      include: {
        wallet: true,
      },
    });

    if (!transaction.wallet) {
      throw new Error('Wallet not found for transaction');
    }

    await this.manongWalletService.updateAmounts(transaction.wallet.manongId, {
      balance: dto.amount!,
    });

    return transaction;
  }

  async fetchPayouts(userId: number) {
    const user = await this.userService.isAdminAndModerator(userId);

    if (!user) {
      throw new BadGatewayException('User is not admin!');
    }

    return await this.prisma.manongWalletTransaction.findMany({
      where: {
        type: WalletTransactionType.payout,
      },
      include: {
        wallet: {
          select: {
            manong: true,
          },
        },
      },
    });
  }

  async completePayoutById(userId: number, id: number) {
    const user = await this.userService.isAdminAndModerator(userId);

    if (!user) {
      throw new BadGatewayException('User is not admin!');
    }

    const payout = await this.prisma.manongWalletTransaction.findUniqueOrThrow({
      where: { id },
      include: { wallet: true },
    });

    if (payout.type !== WalletTransactionType.payout) {
      throw new BadRequestException('Transaction is not a payout');
    }

    const pending = Number(payout.wallet.pending);
    const amount = Number(payout.amount);

    if (amount > pending) {
      throw new BadRequestException('Insufficient pending balance');
    }

    // Deduct from pending
    await this.manongWalletService.updateAmounts(payout.wallet.manongId, {
      pending: -amount,
    });

    // Mark payout transaction as completed
    return await this.prisma.manongWalletTransaction.update({
      where: { id: payout.id },
      data: { status: WalletTransactionStatus.completed },
    });
  }

  // In ManongWalletTransactionService - add this method
  async markPayoutAsFailed(userId: number, id: number) {
    const user = await this.userService.isAdminAndModerator(userId);

    if (!user) {
      throw new BadGatewayException('User is not admin!');
    }

    const payout = await this.prisma.manongWalletTransaction.findUniqueOrThrow({
      where: { id },
      include: { wallet: true },
    });

    if (payout.type !== WalletTransactionType.payout) {
      throw new BadRequestException('Transaction is not a payout');
    }

    if (payout.status === WalletTransactionStatus.failed) {
      throw new BadRequestException('Payout is already marked as failed');
    }

    // Return the pending amount back to wallet if it was deducted
    if (payout.status === WalletTransactionStatus.completed) {
      // If it was completed, we need to add back to pending
      const amount = Number(payout.amount);
      await this.manongWalletService.updateAmounts(payout.wallet.manongId, {
        pending: amount,
      });
    }

    // Mark payout transaction as failed
    return await this.prisma.manongWalletTransaction.update({
      where: { id: payout.id },
      data: { status: WalletTransactionStatus.failed },
    });
  }

  async fetchAllPendingJobFee(walletId: number) {
    return await this.prisma.manongWalletTransaction.findMany({
      where: {
        walletId,
        status: WalletTransactionStatus.pending,
        type: WalletTransactionType.job_fee,
      },
    });
  }

  async payPendingJobFees(walletId: number, dto: PayJobFeesDto) {
    const { ids, currency, provider } = dto;

    if (!ids.length) {
      throw new BadRequestException('No ids found!');
    }

    const transactions = await this.prisma.manongWalletTransaction.findMany({
      where: {
        id: { in: ids },
        walletId,
        type: WalletTransactionType.job_fee,
        status: WalletTransactionStatus.pending,
      },
    });

    if (transactions.length !== ids.length) {
      throw new BadRequestException(
        'Some transactions do not exist or are invalid',
      );
    }

    // Calculate total amount and ensure it's positive
    const totalAmount = transactions.reduce(
      (sum, tx) => sum + Math.abs(Number(tx.amount)), // Use Math.abs to ensure positive
      0,
    );

    // Check minimum amount (100 centavos = 1 PHP)
    if (totalAmount < 1) {
      throw new BadRequestException(
        `Total amount must be at least 1.00 PHP. Current amount: ${(totalAmount / 100).toFixed(2)} PHP`,
      );
    }

    const intentDto: CreatePaymentIntentDto = {
      amount: totalAmount,
      currency: currency ?? 'PHP',
      capture_type: 'automatic',
      description: `Payment for ${transactions.length} job fee(s)`,
      provider,
    };

    const wallet = await this.manongWalletService.fetchByWalletId(walletId);

    const idsString = ids.join(',');

    const result = await this.paymongoService.createPaymentManuallyForJobFees(
      wallet.id,
      intentDto,
      idsString,
    );

    return {
      redirectUrl: result.data.attributes.next_action?.redirect.url ?? '',
      returnUrl: result.data.attributes.next_action?.redirect.return_url ?? '',
    };
  }

  async completePendingJobFees(ids: number[]) {
    return await this.prisma.manongWalletTransaction.updateMany({
      where: {
        id: { in: ids },
        type: WalletTransactionType.job_fee,
      },
      data: {
        status: WalletTransactionStatus.completed,
      },
    });
  }

  async getJobFeesPaymentStatus(ids: number[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No job fee IDs provided.');
    }

    // Get ALL transactions with these IDs (regardless of status)
    const allTransactions = await this.prisma.manongWalletTransaction.findMany({
      where: {
        id: { in: ids },
        type: WalletTransactionType.job_fee,
      },
    });

    // Separate by status
    const completedTransactions = allTransactions.filter(
      (t) => t.status === WalletTransactionStatus.completed,
    );

    const pendingTransactions = allTransactions.filter(
      (t) => t.status === WalletTransactionStatus.pending,
    );

    const failedTransactions = allTransactions.filter(
      (t) => t.status === WalletTransactionStatus.failed,
    );

    const completedIds = completedTransactions.map((t) => t.id);
    const pendingIds = pendingTransactions.map((t) => t.id);
    const failedIds = failedTransactions.map((t) => t.id);

    // Calculate total amount from completed transactions
    const totalAmount = completedTransactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0,
    );

    // Determine overall status
    let status = 'pending';
    if (completedIds.length === ids.length) {
      status = 'completed';
    } else if (completedIds.length > 0 && pendingIds.length === 0) {
      // Some completed, no pending (could be partial with some failed)
      status = 'partial';
    } else if (failedIds.length === ids.length) {
      status = 'failed';
    } else if (failedIds.length > 0) {
      status = 'partial_failed';
    }

    return {
      completedIds,
      pendingIds,
      failedIds,
      totalAmount,
      status,
      summary: {
        total: ids.length,
        completed: completedIds.length,
        pending: pendingIds.length,
        failed: failedIds.length,
      },
    };
  }
}
