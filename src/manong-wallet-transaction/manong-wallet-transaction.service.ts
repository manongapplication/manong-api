import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateManongWalletTransactionDto } from './dto/create-manong-wallet-transaction.dto';
import { UpdateManongWalletTransactionDto } from './dto/update-manong-wallet-transaction.dto';
import { ManongWalletService } from 'src/manong-wallet/manong-wallet.service';

@Injectable()
export class ManongWalletTransactionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ManongWalletService))
    private readonly manongWalletService: ManongWalletService,
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

    await this.manongWalletService.addToBalance(
      transaction.wallet.manongId,
      dto.amount!,
    );

    return transaction;
  }
}
