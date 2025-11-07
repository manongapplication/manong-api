import { Module } from '@nestjs/common';
import { ManongController } from './manong.controller';
import { ManongService } from './manong.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { ServiceRequestModule } from 'src/service-request/service-request.module';
import { UserModule } from 'src/user/user.module';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';

@Module({
  imports: [PrismaModule, AuthModule, ServiceRequestModule, UserModule],
  controllers: [ManongController],
  providers: [ManongService, AppMaintenanceGuard, AppMaintenanceService],
  exports: [ManongService],
})
export class ManongModule {}
