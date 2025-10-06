import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserPaymentMethodService } from './user-payment-method.service';
import { UserPaymentMethodController } from './user-payment-method.controller';
import { PaymentMethodModule } from 'src/payment-method/payment-method.module';

@Module({
  imports: [PrismaModule, PaymentMethodModule],
  providers: [UserPaymentMethodService],
  controllers: [UserPaymentMethodController],
  exports: [UserPaymentMethodService],
})
export class UserPaymentMethodModule {}
