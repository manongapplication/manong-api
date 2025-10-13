import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ServiceItemService {
  constructor(private prisma: PrismaService) {}

  async fetchServiceItems() {
    return this.prisma.serviceItem.findMany({
      include: { subServiceItems: true },
    });
  }

  async getLastUpdated(): Promise<Date | null> {
    const latest = await this.prisma.serviceItem.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });
    return latest?.updatedAt ?? null;
  }

  async getETag(): Promise<string> {
    const [latest, count] = await Promise.all([
      this.prisma.serviceItem.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.serviceItem.count(),
    ]);

    const updatedAt = latest?.updatedAt?.toISOString() ?? '0';
    const hashBase = `${updatedAt}-${count}`;
    const schemaVersion = 'v1'; // change if structure changes
    return crypto
      .createHash('md5')
      .update(`${hashBase}-${schemaVersion}`)
      .digest('hex');
  }
}
