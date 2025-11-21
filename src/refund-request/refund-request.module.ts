import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RefundRequestController } from './refund-request.controller';
import { RefundRequestService } from './refund-request.service';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';
import { UserModule } from 'src/user/user.module';
import { ServiceRequestModule } from 'src/service-request/service-request.module';
import { FcmModule } from 'src/fcm/fcm.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    forwardRef(() => ServiceRequestModule),
    FcmModule,
  ],
  controllers: [RefundRequestController],
  providers: [RefundRequestService, AppMaintenanceGuard, AppMaintenanceService],
  exports: [RefundRequestService],
})
export class RefundRequestModule {}
