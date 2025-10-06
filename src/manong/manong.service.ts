import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ManongService {
  constructor(private prisma: PrismaService) {}

  async fetchManongs(serviceItemId?: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const manongs = this.prisma.user.findMany({
      where: {
        role: 'manong',
        ...(serviceItemId && {
          manongProfile: {
            some: {
              manongSpecialities: {
                some: { subServiceItem: { serviceItemId } },
              },
            },
          },
        }),
      },
      include: {
        manongProfile: {
          include: {
            manongSpecialities: {
              include: {
                subServiceItem: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
    });

    return manongs;
  }

  async findManongById(id: number) {
    return this.prisma.user.findFirst({
      where: { id, role: 'manong' },
      include: {
        manongProfile: {
          include: {
            manongSpecialities: {
              include: {
                subServiceItem: true,
              },
            },
          },
        },
      },
    });
  }
}
