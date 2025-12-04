import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { BookmarkItemService } from './bookmark-item.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { CreateBookmarkItemDto } from './dto/create-bookmark-item.dto';

@UseGuards(JwtAuthGuard, AppMaintenanceGuard)
@Controller('api/bookmark-item')
export class BookmarkItemController {
  constructor(private readonly bookmarkItemService: BookmarkItemService) {}

  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateBookmarkItemDto,
  ) {
    const result = await this.bookmarkItemService.addBookmark(userId, dto);

    return {
      success: true,
      data: result,
      message: 'Bookmark added!',
    };
  }

  @Post('remove')
  async remove(
    @CurrentUserId() userId: number,
    @Body() dto: CreateBookmarkItemDto,
  ) {
    const result = await this.bookmarkItemService.removeBookmark(userId, dto);

    return {
      success: true,
      data: result,
      message: 'Bookmark removed!',
    };
  }

  @Get('sub-service-item')
  async get(@CurrentUserId() userId: number) {
    const result =
      await this.bookmarkItemService.showBookmarkSubServiceItemByUserId(userId);

    return {
      success: true,
      data: result,
      message: 'Bookmark item fetched successfully!',
    };
  }

  @Post('is-bookmarked')
  async isBookmarked(
    @CurrentUserId() userId: number,
    @Body() dto: CreateBookmarkItemDto,
  ) {
    const result = await this.bookmarkItemService.isBookmarked(userId, dto);

    return {
      success: true,
      data: result,
      message: 'Bookmarked checked successfully!',
    };
  }

  @Get('user/:userId')
  async getBookmarksByUser(
    @Param('userId') userId: number,
    @Query() dto: CreateBookmarkItemDto,
  ) {
    const result = await this.bookmarkItemService.fetchBookmarksByUserId(
      userId,
      dto,
    );

    return {
      success: true,
      data: result,
      message: 'Bookmarks fetched successfully!',
    };
  }
}
