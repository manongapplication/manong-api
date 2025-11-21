import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from 'src/fcm/dto/create-notification.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(
    userId: number,
    dto: CreateNotificationDto,
    data?: unknown,
  ) {
    const safeData = JSON.stringify(data);
    return await this.prisma.userNotification.create({
      data: {
        title: dto.title,
        body: dto.body,
        userId,
        data: safeData,
      },
    });
  }

  async fetchNotificationsByUserId(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const notification = await this.prisma.userNotification.findMany({
      where: {
        userId,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return notification;
  }

  async seenNotification(id: number) {
    return await this.prisma.userNotification.update({
      where: {
        id,
      },
      data: {
        seenAt: new Date(),
      },
    });
  }

  async seenAllNotification(userId: number) {
    return await this.prisma.userNotification.updateMany({
      where: {
        userId,
        seenAt: null,
      },
      data: {
        seenAt: new Date(),
      },
    });
  }

  async hasUnreadNotification(userId: number) {
    const count = await this.prisma.userNotification.count({
      where: {
        seenAt: null,
        userId,
      },
    });

    return {
      count,
      hasUnread: count > 0,
    };
  }
}
