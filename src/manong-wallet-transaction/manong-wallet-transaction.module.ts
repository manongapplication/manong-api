import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ManongWalletTransactionService } from './manong-wallet-transaction.service';
import { ManongWalletTransactionController } from './manong-wallet-transaction.controller';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule],
  providers: [
    ManongWalletTransactionService,
    AppMaintenanceGuard,
    AppMaintenanceService,
  ],
  controllers: [ManongWalletTransactionController],
  exports: [ManongWalletTransactionService],
})
export class ManongWalletTransactionModule {}
