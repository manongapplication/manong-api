import { Controller, Get, Headers, Res } from '@nestjs/common';
import express from 'express';
import { ServiceItemService } from './service-item.service';

@Controller('api/service-items')
export class ServiceItemController {
  constructor(private readonly serviceItemService: ServiceItemService) {}

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

  @Get('last-updated')
  async getLastUpdated() {
    const latest = await this.serviceItemService.getLastUpdated();
    return { success: true, lastUpdated: latest?.toISOString() ?? null };
  }
}
