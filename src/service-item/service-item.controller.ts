import { Controller, Get } from '@nestjs/common';
import { ServiceItemService } from './service-item.service';

@Controller('api/service-items')
export class ServiceItemController {
  constructor(private readonly serviceItemService: ServiceItemService) {}

  @Get()
  async index() {
    const serviceItems = await this.serviceItemService.fetchServiceItems();

    return { success: true, data: serviceItems };
  }
}
