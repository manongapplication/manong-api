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
];

export async function createTestingModule(
  providers: any[],
): Promise<TestingModule> {
  return await Test.createTestingModule({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    providers: [...providers, ...defaultMocks],
  }).compile();
}
