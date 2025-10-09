import { PaymentMethodController } from './payment-method.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('PaymentMethodController', () => {
  let controller: PaymentMethodController;

  beforeEach(async () => {
    const module = await createTestingModule([PaymentMethodController]);
    controller = module.get<PaymentMethodController>(PaymentMethodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
