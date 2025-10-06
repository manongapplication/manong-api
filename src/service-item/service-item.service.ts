import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServiceItemService {
  constructor(private prisma: PrismaService) {}

  async fetchServiceItems() {
    const serviceItems = await this.prisma.serviceItem.findMany({
      include: {
        subServiceItems: true,
      },
    });

    return serviceItems;
  }
}
