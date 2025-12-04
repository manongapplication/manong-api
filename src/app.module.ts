import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { ServiceItemService } from './service-item/service-item.service';
import { ServiceItemController } from './service-item/service-item.controller';
import { ServiceItemModule } from './service-item/service-item.module';
import { ManongService } from './manong/manong.service';
import { ManongModule } from './manong/manong.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { ServiceRequestModule } from './service-request/service-request.module';
import { PrismaService } from './prisma/prisma.service';
import { setPrismaService } from './common/validators/exists.validator';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PaymongoService } from './paymongo/paymongo.service';
import { PaymongoController } from './paymongo/paymongo.controller';
import { PaymongoModule } from './paymongo/paymongo.module';
import { UserPaymentMethodService } from './user-payment-method/user-payment-method.service';
import { UserPaymentMethodController } from './user-payment-method/user-payment-method.controller';
import { UserPaymentMethodModule } from './user-payment-method/user-payment-method.module';
import { GoogleGeocodingService } from './google-geocoding/google-geocoding.service';
import { GoogleGeocodingController } from './google-geocoding/google-geocoding.controller';
import { GoogleGeocodingModule } from './google-geocoding/google-geocoding.module';
import { TwilioService } from './twilio/twilio.service';
import { TwilioController } from './twilio/twilio.controller';
import { TwilioModule } from './twilio/twilio.module';
import { TrackingGateway } from './tracking/tracking.gateway';
import { TrackingModule } from './tracking/tracking.module';
import { ChatGateway } from './chat/chat.gateway';
import { ChatModule } from './chat/chat.module';
import { ImageUploadModule } from './image-upload/image-upload.module';
import { ImageUploadController } from './image-upload/image-upload.controller';
import { ImageUploadService } from './image-upload/image-upload.service';
import { FirebaseService } from './firebase/firebase.service';
import { FirebaseController } from './firebase/firebase.controller';
import { FirebaseModule } from './firebase/firebase.module';
import { FcmService } from './fcm/fcm.service';
import { FcmController } from './fcm/fcm.controller';
import { FcmModule } from './fcm/fcm.module';
import { UserNotificationService } from './user-notification/user-notification.service';
import { UserNotificationController } from './user-notification/user-notification.controller';
import { UserNotificationModule } from './user-notification/user-notification.module';
import { ServiceSettingsService } from './service-settings/service-settings.service';
import { ServiceSettingsController } from './service-settings/service-settings.controller';
import { ServiceSettingsModule } from './service-settings/service-settings.module';
import { UrgencyLevelService } from './urgency-level/urgency-level.service';
import { UrgencyLevelController } from './urgency-level/urgency-level.controller';
import { UrgencyLevelModule } from './urgency-level/urgency-level.module';
import { ProviderVerificationService } from './provider-verification/provider-verification.service';
import { ProviderVerificationController } from './provider-verification/provider-verification.controller';
import { ProviderVerificationModule } from './provider-verification/provider-verification.module';
import { FeedbackService } from './feedback/feedback.service';
import { FeedbackController } from './feedback/feedback.controller';
import { FeedbackModule } from './feedback/feedback.module';
import { EnvController } from './env.controller';
import { AppMaintenanceService } from './app-maintenance/app-maintenance.service';
import { AppMaintenanceController } from './app-maintenance/app-maintenance.controller';
import { AppMaintenanceModule } from './app-maintenance/app-maintenance.module';
import { WordpressPostService } from './wordpress-post/wordpress-post.service';
import { WordpressPostController } from './wordpress-post/wordpress-post.controller';
import { WordpressPostModule } from './wordpress-post/wordpress-post.module';
import { PaymentTransactionService } from './payment-transaction/payment-transaction.service';
import { PaymentTransactionController } from './payment-transaction/payment-transaction.controller';
import { PaymentTransactionModule } from './payment-transaction/payment-transaction.module';
import { RefundRequestService } from './refund-request/refund-request.service';
import { RefundRequestController } from './refund-request/refund-request.controller';
import { RefundRequestModule } from './refund-request/refund-request.module';
import { ManongReportService } from './manong-report/manong-report.service';
import { ManongReportController } from './manong-report/manong-report.controller';
import { ManongReportModule } from './manong-report/manong-report.module';
import { ReferralCodeService } from './referral-code/referral-code.service';
import { ReferralCodeController } from './referral-code/referral-code.controller';
import { ReferralCodeModule } from './referral-code/referral-code.module';
import { ReferralCodeUsageService } from './referral-code-usage/referral-code-usage.service';
import { ReferralCodeUsageController } from './referral-code-usage/referral-code-usage.controller';
import { ReferralCodeUsageModule } from './referral-code-usage/referral-code-usage.module';
import { RedisService } from './redis/redis.service';
import { QueuesModule } from './queues/queues.module';
import { BookmarkItemService } from './bookmark-item/bookmark-item.service';
import { BookmarkItemController } from './bookmark-item/bookmark-item.controller';
import { BookmarkItemModule } from './bookmark-item/bookmark-item.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    ServiceItemModule,
    ManongModule,
    PaymentMethodModule,
    ServiceRequestModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/', // serve at the root
      serveStaticOptions: {
        index: false,
      },
    }),
    PaymongoModule,
    UserPaymentMethodModule,
    GoogleGeocodingModule,
    TwilioModule,
    TrackingModule,
    ChatModule,
    ImageUploadModule,
    FirebaseModule,
    FcmModule,
    UserNotificationModule,
    ServiceSettingsModule,
    UrgencyLevelModule,
    ProviderVerificationModule,
    FeedbackModule,
    AppMaintenanceModule,
    WordpressPostModule,
    PaymentTransactionModule,
    RefundRequestModule,
    ManongReportModule,
    ReferralCodeModule,
    ReferralCodeUsageModule,
    QueuesModule,
    BookmarkItemModule,
  ],
  controllers: [
    AppController,
    ServiceItemController,
    PaymongoController,
    UserPaymentMethodController,
    GoogleGeocodingController,
    TwilioController,
    ImageUploadController,
    FirebaseController,
    FcmController,
    UserNotificationController,
    ServiceSettingsController,
    UrgencyLevelController,
    ProviderVerificationController,
    FeedbackController,
    EnvController,
    AppMaintenanceController,
    WordpressPostController,
    PaymentTransactionController,
    RefundRequestController,
    ManongReportController,
    ReferralCodeController,
    ReferralCodeUsageController,
    BookmarkItemController,
  ],
  providers: [
    UserService,
    ServiceItemService,
    ManongService,
    PaymongoService,
    UserPaymentMethodService,
    GoogleGeocodingService,
    TwilioService,
    TrackingGateway,
    ChatGateway,
    ImageUploadService,
    FirebaseService,
    FcmService,
    UserNotificationService,
    ServiceSettingsService,
    UrgencyLevelService,
    ProviderVerificationService,
    FeedbackService,
    AppMaintenanceService,
    WordpressPostService,
    PaymentTransactionService,
    RefundRequestService,
    ManongReportService,
    ReferralCodeService,
    ReferralCodeUsageService,
    RedisService,
    BookmarkItemService,
  ],
})
export class AppModule {
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    setPrismaService(this.prisma);
    console.log('AppModule initialized, PrismaService set for validation');
  }
}
