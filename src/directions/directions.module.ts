import { Module } from '@nestjs/common';
import { DirectionsController } from './directions.controller';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';
import { DirectionsService } from './directions.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, UserModule, AuthModule],
  controllers: [DirectionsController],
  providers: [DirectionsService, AppMaintenanceGuard, AppMaintenanceService],
  exports: [DirectionsService],
})
export class DirectionsModule {}
