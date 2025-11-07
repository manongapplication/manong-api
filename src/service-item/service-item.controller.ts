import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import express from 'express';
import { ServiceItemService } from './service-item.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreateServiceItems } from './dto/create-service-items.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';

@Controller('api/service-items')
export class ServiceItemController {
  constructor(private readonly serviceItemService: ServiceItemService) {}

  @UseGuards(AppMaintenanceGuard)
  @Get()
  async index(
    @Headers('if-none-match') ifNoneMatch: string,
    @Res() res: express.Response,
  ) {
    const etag = await this.serviceItemService.getETag();

    // If ETag matches, tell client: not modified
    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).send();
    }

    const serviceItems = await this.serviceItemService.fetchServiceItems();

    // Return new data with the ETag in response header
    return res
      .setHeader('ETag', etag)
      .status(200)
      .json({ success: true, etag, data: serviceItems });
  }

  @UseGuards(AppMaintenanceGuard)
  @Get('last-updated')
  async getLastUpdated() {
    const latest = await this.serviceItemService.getLastUpdated();
    return { success: true, lastUpdated: latest?.toISOString() ?? null };
  }

  @AdminOnly()
  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Post('save')
  async saveData(@Body() dto: CreateServiceItems) {
    const result = await this.serviceItemService.saveServiceItems(dto);

    return {
      success: true,
      message: result,
    };
  }

  @AdminOnly()
  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Post('reset-defaults')
  async resetDefaults(@CurrentUserId() userId: number) {
    await this.serviceItemService.resetDefaults(userId);

    return { message: 'Service items reset to defaults from seeders' };
  }
}
