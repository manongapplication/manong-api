import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateManongWalletTransactionDto } from './dto/create-manong-wallet-transaction.dto';

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
}
