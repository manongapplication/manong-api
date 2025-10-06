import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UserNotificationService } from 'src/user-notification/user-notification.service';
import { UserService } from 'src/user/user.service';
@Injectable()
export class FcmService {
  constructor(
    private readonly userNotificationService: UserNotificationService,
    private readonly userService: UserService,
  ) {}
  private readonly logger = new Logger(FcmService.name);

  async sendPushNotification(dto: CreateNotificationDto) {
    this.logger.log(`CreateNotificationDto token: ${dto.token}`);
    const data = {
      title: dto.title,
      body: dto.body,
      ...(dto.serviceRequestId != null && {
        serviceRequestId: dto.serviceRequestId,
      }),
      ...(dto.status != null && {
        status: dto.status,
      }),
      ...(dto.paymentStatus != null && {
        paymentStatus: dto.paymentStatus,
      }),
    };

    try {
      await this.userNotificationService.createNotification(
        dto.userId,
        dto,
        data,
      );

      const title = dto.title;
      const body = dto.body;
      const token = dto.token;
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data,
        token,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push sent successfully: ${response}`);

      return response;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'messaging/registration-token-not-registered') {
        this.logger.warn(`Token no longer valid: ${dto.token}`);
        await this.userService.updateFcmToken(dto.userId, '');

        return true;
      } // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      else if (error.code == 'messaging/invalid-payload') {
        this.logger.warn(
          `One of the parameter is empty ${JSON.stringify(dto)}`,
        );

        return true;
      }
      this.logger.error('Error sending push', error);
      throw error;
    }
  }
}
