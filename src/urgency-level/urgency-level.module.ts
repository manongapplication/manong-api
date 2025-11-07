import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UrgencyLevelService } from './urgency-level.service';
import { UrgencyLevelController } from './urgency-level.controller';
import { UserModule } from 'src/user/user.module';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';

@Module({
  imports: [PrismaModule, UserModule],
  providers: [UrgencyLevelService, AppMaintenanceService, AppMaintenanceGuard],
  controllers: [UrgencyLevelController],
  exports: [UrgencyLevelService],
})
export class UrgencyLevelModule {}
