import { BadGatewayException, Injectable } from '@nestjs/common';
import { CreateManongWalletDto } from './dto/create-manong-wallet.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateManongWalletDto } from './dto/update-manong-wallet.dto';

@Injectable()
export class ManongWalletService {
  constructor(private readonly prisma: PrismaService) {}

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
}
