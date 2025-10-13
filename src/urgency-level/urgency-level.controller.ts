import { Controller, Get } from '@nestjs/common';
import { UrgencyLevelService } from './urgency-level.service';

@Controller('api/urgency-level')
export class UrgencyLevelController {
  constructor(private readonly urgencyLevelService: UrgencyLevelService) {}

  @Get()
  async fetchUrgencyLevels() {
    const result = await this.urgencyLevelService.fetchUrgencyLevels();

    return {
      success: true,
      data: result,
      message: 'Urgency Levels fetched!',
    };
  }
}
