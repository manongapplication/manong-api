import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateManongWalletTransactionDto } from './dto/create-manong-wallet-transaction.dto';
import { UpdateManongWalletTransactionDto } from './dto/update-manong-wallet-transaction.dto';

@Injectable()
export class ManongWalletTransactionService {
  constructor(private readonly prisma: PrismaService) {}

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

  async fetchWalletTransactionById(id: number) {
    const transaction = await this.prisma.manongWalletTransaction.findUnique({
      where: { id },
    });

    return transaction;
  }

  async fetchWalletTransactionsByWalletId(walletId: number) {
    const transactions = await this.prisma.manongWalletTransaction.findMany({
      where: {
        walletId,
      },
    });

    return transactions;
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
}
