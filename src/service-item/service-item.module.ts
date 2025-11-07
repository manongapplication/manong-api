import { Module } from '@nestjs/common';
import { ServiceItemService } from './service-item.service';
import { ServiceItemController } from './service-item.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [ServiceItemController],
  providers: [ServiceItemService, AppMaintenanceGuard, AppMaintenanceService],
  exports: [ServiceItemService],
})
export class ServiceItemModule {}
