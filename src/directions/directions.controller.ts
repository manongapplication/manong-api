import { Body, Controller, Post } from '@nestjs/common';
import { DirectionsService } from './directions.service';

@Controller('directions')
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
