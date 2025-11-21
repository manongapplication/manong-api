import { PaymentTransactionController } from './payment-transaction.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('PaymentTransactionController', () => {
  let controller: PaymentTransactionController;

  beforeEach(async () => {
    const module = await createTestingModule([PaymentTransactionController]);
    controller = module.get<PaymentTransactionController>(
      PaymentTransactionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
