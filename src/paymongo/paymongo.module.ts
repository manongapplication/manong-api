import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymongoService } from './paymongo.service';
import { PaymongoController } from './paymongo.controller';
import { UserPaymentMethodModule } from 'src/user-payment-method/user-payment-method.module';
import { ServiceRequestModule } from 'src/service-request/service-request.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { ManongWalletTransactionModule } from 'src/manong-wallet-transaction/manong-wallet-transaction.module';

@Module({
  imports: [
    PrismaModule,
    UserPaymentMethodModule,
    AuthModule,
    forwardRef(() => ServiceRequestModule),
    UserModule,
    ManongWalletTransactionModule,
  ],
  providers: [PaymongoService],
  controllers: [PaymongoController],
  exports: [PaymongoService],
})
export class PaymongoModule {}
