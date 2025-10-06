import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { FcmService } from './fcm.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';

@Controller('api/notifications')
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  @UseGuards(JwtAuthGuard)
  @Post('push')
  async sendPush(@Body() dto: CreateNotificationDto) {
    return this.fcmService.sendPushNotification(dto);
  }
}
