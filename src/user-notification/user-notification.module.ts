import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserNotificationService } from './user-notification.service';
import { UserNotificationController } from './user-notification.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [UserNotificationService],
  controllers: [UserNotificationController],
  exports: [UserNotificationService],
})
export class UserNotificationModule {}
