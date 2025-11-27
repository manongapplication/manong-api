import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { ReferralCodeController } from './referral-code.controller';
import { ReferralCodeService } from './referral-code.service';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';
import { ReferralCodeUsageModule } from 'src/referral-code-usage/referral-code-usage.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    ReferralCodeUsageModule,
  ],
  controllers: [ReferralCodeController],
  providers: [ReferralCodeService, AppMaintenanceGuard, AppMaintenanceService],
  exports: [ReferralCodeService],
})
export class ReferralCodeModule {}
