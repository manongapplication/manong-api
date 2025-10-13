import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServiceSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchServiceSettings() {
    return await this.prisma.serviceSettings.findFirst();
  }
}
