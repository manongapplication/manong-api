import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UrgencyLevelService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchUrgencyLevels() {
    const result = await this.prisma.urgencyLevel.findMany();

    return result;
  }
}
