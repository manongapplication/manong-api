import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserNotificationService } from './user-notification.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { CreateNotificationDto } from 'src/fcm/dto/create-notification.dto';

@Controller('api/notification')
export class UserNotificationController {
  constructor(
    private readonly userNotificationService: UserNotificationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createNotification(
    @CurrentUserId() userId: number,
    @Body() dto: CreateNotificationDto,
    data: unknown,
  ) {
    const result = await this.userNotificationService.createNotification(
      userId,
      dto,
      data,
    );

    return {
      success: true,
      data: result,
      message: 'Notification created!',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async fetchNotifications(
    @CurrentUserId() userId: number,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.userNotificationService.fetchNotificationsByUserId(
      userId,
      parseInt(page),
      parseInt(limit),
    );

    return {
      success: true,
      data,
      message: 'Fetched notifications',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/seen')
  async seenNotification(@Param('id', ParseIntPipe) id: number) {
    const data = await this.userNotificationService.seenNotification(id);

    return {
      success: true,
      data,
      message: 'Seened notificaiton',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('seenAll')
  async seenAllNotification(@CurrentUserId() userId: number) {
    const data = await this.userNotificationService.seenAllNotification(userId);

    return {
      success: true,
      data,
      message: 'Seened All notificaitons',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread/count')
  async getUnreadCount(@CurrentUserId() userId: number) {
    const result =
      await this.userNotificationService.hasUnreadNotification(userId);

    return {
      success: true,
      data: result,
      message: 'Unread notification count fetched',
    };
  }
}
