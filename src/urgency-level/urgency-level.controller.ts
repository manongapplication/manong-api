import {
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UrgencyLevelService } from './urgency-level.service';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreateUrgencyLevel } from './dto/create-urgency-level.dto';

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

  @AdminOnly()
  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Put(':id')
  async updateUrgencyLevel(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: CreateUrgencyLevel,
  ) {
    const result = await this.urgencyLevelService.updateUrgencyLevel(
      userId,
      id,
      updateData,
    );

    return {
      success: true,
      data: result,
      message: 'Urgency Level updated successfully!',
    };
  }

  @AdminOnly()
  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Post('reset-defaults')
  async resetDefaults(@CurrentUserId() userId: number) {
    await this.urgencyLevelService.resetDefaults(userId);

    return {
      success: true,
      message: 'Urgency levels reset to defaults from seeders',
    };
  }
}
