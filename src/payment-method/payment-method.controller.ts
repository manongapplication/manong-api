import { Controller, Get } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';

@Controller('api/payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Get()
  async index() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const paymentMethods =
      await this.paymentMethodService.fetchPaymentMethods();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { success: true, data: paymentMethods };
  }
}
