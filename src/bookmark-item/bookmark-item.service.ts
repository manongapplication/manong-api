import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookmarkItemDto } from './dto/create-bookmark-item.dto';
import { UserService } from 'src/user/user.service';
import { BookmarkType } from '@prisma/client';

@Injectable()
export class BookmarkItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async addBookmark(userId: number, dto: CreateBookmarkItemDto) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    return await this.prisma.bookmarkItem.create({
      data: {
        userId: userId,
        type: dto.type,
        serviceItemId: dto.serviceItemId,
        subServiceItemId: dto.subServiceItemId,
        manongId: dto.manongId,
      },
    });
  }

  async removeBookmark(userId: number, dto: CreateBookmarkItemDto) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const whereCondition: any = {
      userId,
      type: dto.type,
    };

    // Add type-specific conditions
    switch (dto.type) {
      case BookmarkType.SERVICE_ITEM:
        if (dto.serviceItemId) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          whereCondition.serviceItemId = dto.serviceItemId;
        }
        break;
      case BookmarkType.SUB_SERVICE_ITEM:
        if (dto.subServiceItemId) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          whereCondition.subServiceItemId = dto.subServiceItemId;
        }
        break;
      case BookmarkType.MANONG:
        if (dto.manongId) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          whereCondition.manongId = dto.manongId;
        }
        break;
    }

    const result = await this.prisma.bookmarkItem.deleteMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: whereCondition,
    });

    if (result.count === 0) {
      throw new NotFoundException('Bookmark not found');
    }

    return {
      success: true,
      message: 'Bookmark removed successfully',
      count: result.count,
    };
  }

  async showBookmarkSubServiceItemByUserId(userId: number) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    return await this.prisma.bookmarkItem.findMany({
      where: {
        userId,
        type: BookmarkType.SUB_SERVICE_ITEM,
      },
    });
  }

  async isBookmarked(userId: number, dto: CreateBookmarkItemDto) {
    const bookmark = await this.prisma.bookmarkItem.findFirst({
      where: {
        userId,
        type: dto.type,
        // Depending on the type, check different fields
        ...(dto.type === BookmarkType.SERVICE_ITEM &&
          dto.serviceItemId && {
            serviceItemId: dto.serviceItemId,
          }),
        ...(dto.type === BookmarkType.SUB_SERVICE_ITEM &&
          dto.subServiceItemId && {
            subServiceItemId: dto.subServiceItemId,
          }),
        ...(dto.type === BookmarkType.MANONG &&
          dto.manongId && {
            manongId: dto.manongId,
          }),
      },
    });

    return !!bookmark; // Return true if bookmark exists, false otherwise
  }

  async fetchBookmarksByUserId(
    userId: number,
    filters?: {
      type?: BookmarkType;
      serviceItemId?: number;
      subServiceItemId?: number;
      manongId?: number;
    },
  ) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const whereCondition: any = {
      userId,
    };

    // Apply filters if provided
    if (filters) {
      if (filters.type) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        whereCondition.type = filters.type;
      }

      // Add type-specific conditions
      if (filters.type === BookmarkType.SERVICE_ITEM && filters.serviceItemId) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        whereCondition.serviceItemId = filters.serviceItemId;
      } else if (
        filters.type === BookmarkType.SUB_SERVICE_ITEM &&
        filters.subServiceItemId
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        whereCondition.subServiceItemId = filters.subServiceItemId;
      } else if (filters.type === BookmarkType.MANONG && filters.manongId) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        whereCondition.manongId = filters.manongId;
      }
    }

    return await this.prisma.bookmarkItem.findMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: whereCondition,
      orderBy: {
        createdAt: 'desc',
      },
      // Include related data dynamically based on type
      include: {
        serviceItem: filters?.type === BookmarkType.SERVICE_ITEM,
        subServiceItem: filters?.type === BookmarkType.SUB_SERVICE_ITEM,
        manong: filters?.type === BookmarkType.MANONG,
      },
    });
  }
}
