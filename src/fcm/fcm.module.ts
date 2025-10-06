import { Module } from '@nestjs/common';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { FcmService } from './fcm.service';
import { FcmController } from './fcm.controller';
import { UserNotificationModule } from 'src/user-notification/user-notification.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [FirebaseModule, UserNotificationModule, UserModule],
  providers: [FcmService],
  controllers: [FcmController],
  exports: [FcmService],
})
export class FcmModule {}
