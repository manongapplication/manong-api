import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { AppMaintenanceService } from './app-maintenance.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { UpdateAppMaintenance } from './dto/update-app-maintenance.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';

@Controller('api/app-maintenance')
export class AppMaintenanceController {
  constructor(private readonly appMaintenanceService: AppMaintenanceService) {}

  @Public()
  @Get()
  async index() {
    const result = await this.appMaintenanceService.fetchAppMaintenance();

    return {
      success: true,
      data: result,
      message: 'Fetched App Maintenance!',
    };
  }

  @Public()
  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Post(':id')
  async update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppMaintenance,
  ) {
    const result = await this.appMaintenanceService.updateAppMaintenance(
      userId,
      id,
      dto,
    );

    return {
      success: true,
      data: result,
      message: 'App Maintenance is updated successfully!',
    };
  }
}
