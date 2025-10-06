import { forwardRef, Module } from '@nestjs/common';
import { ServiceRequestController } from './service-request.controller';
import { ServiceRequestService } from './service-request.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { GoogleGeocodingModule } from 'src/google-geocoding/google-geocoding.module';
import { UserPaymentMethodModule } from 'src/user-payment-method/user-payment-method.module';
import { PaymongoModule } from 'src/paymongo/paymongo.module';
import { UserModule } from 'src/user/user.module';
import { FcmModule } from 'src/fcm/fcm.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GoogleGeocodingModule,
    UserPaymentMethodModule,
    forwardRef(() => PaymongoModule),
    UserModule,
    FcmModule,
  ],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService],
  exports: [ServiceRequestService],
})
export class ServiceRequestModule {}
