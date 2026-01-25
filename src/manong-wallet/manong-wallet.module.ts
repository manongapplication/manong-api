import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ManongWalletController } from './manong-wallet.controller';
import { ManongWalletService } from './manong-wallet.service';
import { ManongWalletTransactionModule } from 'src/manong-wallet-transaction/manong-wallet-transaction.module';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    ManongWalletTransactionModule,
  ],
  providers: [ManongWalletService, AppMaintenanceGuard, AppMaintenanceService],
  controllers: [ManongWalletController],
  exports: [ManongWalletService],
})
export class ManongWalletModule {}
