import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DirectionsService } from './directions.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';

@UseGuards(JwtAuthGuard, AppMaintenanceGuard)
@Controller('api/directions')
export class DirectionsController {
  constructor(private readonly directionsService: DirectionsService) {}

  @Post()
  async getRoute(
    @Body('origin') origin: string,
    @Body('destination') destination: string,
  ) {
    return this.directionsService.getRoute(origin, destination);
  }
}
