import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UserNotificationService } from 'src/user-notification/user-notification.service';
import { UserService } from 'src/user/user.service';
import { ModuleRef } from '@nestjs/core';
@Injectable()
export class FcmService {
  private userNotificationService: UserNotificationService;
  private userService: UserService;

  constructor(private readonly moduleRef: ModuleRef) {}

  private readonly logger = new Logger(FcmService.name);

  // eslint-disable-next-line @typescript-eslint/require-await
  private async initDependencies() {
    if (!this.userNotificationService) {
      this.userNotificationService = this.moduleRef.get(
        UserNotificationService,
        { strict: false }, // allow circular
      );
    }
    if (!this.userService) {
      this.userService = this.moduleRef.get(UserService, { strict: false });
    }
  }

  async sendPushNotification(
    dto: CreateNotificationDto,
    otherData?: Record<string, any>,
  ) {
    await this.initDependencies();

    if (!dto.token || !dto.title || !dto.body) {
      this.logger.warn(`Missing required fields: ${JSON.stringify(dto)}`);
      return;
    }

    this.logger.log(`CreateNotificationDto token: ${dto.token}`);
    const data = Object.entries({
      title: dto.title,
      body: dto.body,
      ...(dto.serviceRequestId != null && {
        serviceRequestId: dto.serviceRequestId,
      }),
      ...(dto.status != null && { status: dto.status }),
      ...(dto.paymentStatus != null && { paymentStatus: dto.paymentStatus }),
      ...(otherData ?? {}),
    }).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    try {
      if (data.type !== 'chat') {
        await this.userNotificationService.createNotification(
          dto.userId,
          dto,
          data,
        );
      }

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
      // this.logger.log(`Push sent successfully: ${response}`);

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
