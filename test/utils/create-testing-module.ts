import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserNotificationService } from 'src/user-notification/user-notification.service';
import { FcmService } from 'src/fcm/fcm.service';
import { UserService } from 'src/user/user.service';
import { ServiceItemService } from 'src/service-item/service-item.service';
import { AuthService } from 'src/auth/auth.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { EventEmitter } from 'stream';
import { UserPaymentMethodService } from 'src/user-payment-method/user-payment-method.service';
import { ImageUploadService } from 'src/image-upload/image-upload.service';
import { PaymongoService } from 'src/paymongo/paymongo.service';
import { ServiceRequestService } from 'src/service-request/service-request.service';
import { ManongService } from 'src/manong/manong.service';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';
import { GoogleGeocodingService } from 'src/google-geocoding/google-geocoding.service';
import { UrgencyLevelService } from 'src/urgency-level/urgency-level.service';
import { ServiceSettingsService } from 'src/service-settings/service-settings.service';
import { ProviderVerificationService } from 'src/provider-verification/provider-verification.service';
import { FeedbackService } from 'src/feedback/feedback.service';
import { WordpressPostService } from 'src/wordpress-post/wordpress-post.service';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';
import { PaymentTransactionService } from 'src/payment-transaction/payment-transaction.service';
import { ManongReportService } from 'src/manong-report/manong-report.service';
import { RefundRequestService } from 'src/refund-request/refund-request.service';
import { ReferralCodeService } from 'src/referral-code/referral-code.service';
import { ReferralCodeUsageService } from 'src/referral-code-usage/referral-code-usage.service';
import { OtpService } from 'src/otp/otp.service';
import { OtpProcessorService } from 'src/queues/otp/otp-processor/otp-processor.service';
import { OtpQueueService } from 'src/queues/otp/otp-queue/otp-queue.service';
import { BookmarkItemService } from 'src/bookmark-item/bookmark-item.service';
import { DirectionsService } from 'src/directions/directions.service';
import { AppVersionService } from 'src/app-version/app-version.service';

// 🧩 Add here any other frequently injected services
// (so you won’t need to mock them manually later)
const defaultMocks = [
  { provide: PrismaService, useValue: {} },
  { provide: ConfigService, useValue: {} },
  { provide: JwtService, useValue: {} },
  { provide: UserNotificationService, useValue: {} },
  { provide: FcmService, useValue: {} },
  { provide: UserService, useValue: {} },
  { provide: ServiceItemService, useValue: {} },
  { provide: AuthService, useValue: {} },
  { provide: TwilioService, useValue: {} },
  { provide: EventEmitter, useValue: {} },
  { provide: UserPaymentMethodService, useValue: {} },
  { provide: PaymentMethodService, useValue: {} },
  { provide: ImageUploadService, useValue: {} },
  { provide: PaymongoService, useValue: {} },
  { provide: ServiceRequestService, useValue: {} },
  { provide: ManongService, useValue: {} },
  { provide: GoogleGeocodingService, useValue: {} },
  { provide: UrgencyLevelService, useValue: {} },
  { provide: ServiceSettingsService, useValue: {} },
  { provide: ProviderVerificationService, useValue: {} },
  { provide: FeedbackService, useValue: {} },
  { provide: WordpressPostService, useValue: {} },
  { provide: AppMaintenanceService, useValue: {} },
  { provide: PaymentTransactionService, useValue: {} },
  { provide: RefundRequestService, useValue: {} },
  { provide: ManongReportService, useValue: {} },
  { provide: ReferralCodeService, useValue: {} },
  { provide: ReferralCodeUsageService, useValue: {} },
  { provide: OtpService, useValue: {} },
  { provide: OtpProcessorService, useValue: {} },
  { provide: OtpQueueService, useValue: {} },
  { provide: BookmarkItemService, useValue: {} },
  { provide: DirectionsService, useValue: {} },
  { provide: AppVersionService, useValue: {} },
];

export async function createTestingModule(
  providers: any[],
): Promise<TestingModule> {
  return await Test.createTestingModule({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    providers: [...providers, ...defaultMocks],
  }).compile();
}
