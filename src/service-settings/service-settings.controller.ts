import { Controller, Get } from '@nestjs/common';
import { ServiceSettingsService } from './service-settings.service';

@Controller('api/service-settings')
export class ServiceSettingsController {
  constructor(
    private readonly serviceSettingsService: ServiceSettingsService,
  ) {}

  @Get()
  async fetchServiceSettings() {
    const result = await this.serviceSettingsService.fetchServiceSettings();

    return {
      success: true,
      data: result,
      message: 'Service settings fetched!',
    };
  }
}
