import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReferralCodeUsageService } from './referral-code-usage.service';
import { ReferralCodeUsageController } from './referral-code-usage.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ReferralCodeUsageController],
  providers: [ReferralCodeUsageService],
  exports: [ReferralCodeUsageService],
})
export class ReferralCodeUsageModule {}
