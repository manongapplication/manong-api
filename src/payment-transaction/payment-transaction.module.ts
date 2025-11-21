import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentTransactionController } from './payment-transaction.controller';
import { PaymentTransactionService } from './payment-transaction.service';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';
import { UserModule } from 'src/user/user.module';
import { FcmModule } from 'src/fcm/fcm.module';

@Module({
  imports: [PrismaModule, UserModule, FcmModule],
  controllers: [PaymentTransactionController],
  providers: [
    PaymentTransactionService,
    AppMaintenanceGuard,
    AppMaintenanceService,
  ],
  exports: [PaymentTransactionService],
})
export class PaymentTransactionModule {}
