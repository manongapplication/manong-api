import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ManongWalletTransactionService } from './manong-wallet-transaction.service';
import { ManongWalletTransactionController } from './manong-wallet-transaction.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ManongWalletTransactionService],
  controllers: [ManongWalletTransactionController],
  exports: [ManongWalletTransactionService],
})
export class ManongWalletTransactionModule {}
