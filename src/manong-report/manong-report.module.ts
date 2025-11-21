import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ManongReportService } from './manong-report.service';
import { ManongReportController } from './manong-report.controller';
import { UserModule } from 'src/user/user.module';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';
import { ServiceRequestModule } from 'src/service-request/service-request.module';

@Module({
  imports: [PrismaModule, UserModule, ServiceRequestModule],
  providers: [ManongReportService, AppMaintenanceGuard, AppMaintenanceService],
  controllers: [ManongReportController],
  exports: [ManongReportService],
})
export class ManongReportModule {}
