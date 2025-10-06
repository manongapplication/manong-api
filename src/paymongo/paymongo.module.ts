import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymongoService } from './paymongo.service';
import { PaymongoController } from './paymongo.controller';
import { PaymentMethodModule } from 'src/payment-method/payment-method.module';
import { UserPaymentMethodModule } from 'src/user-payment-method/user-payment-method.module';
import { ServiceRequestModule } from 'src/service-request/service-request.module';

@Module({
  imports: [
    PrismaModule,
    PaymentMethodModule,
    UserPaymentMethodModule,
    forwardRef(() => ServiceRequestModule),
  ],
  providers: [PaymongoService],
  controllers: [PaymongoController],
  exports: [PaymongoService],
})
export class PaymongoModule {}
