import { Module } from '@nestjs/common';
import { DirectionsController } from './directions.controller';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';
import { DirectionsService } from './directions.service';

@Module({
  imports: [],
  controllers: [
    DirectionsController,
    AppMaintenanceGuard,
    AppMaintenanceService,
  ],
  providers: [DirectionsService],
  exports: [DirectionsService],
})
export class DirectionsModule {}
