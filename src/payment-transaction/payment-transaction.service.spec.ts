import { PaymentTransactionService } from './payment-transaction.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('PaymentTransactionService', () => {
  let service: PaymentTransactionService;

  beforeEach(async () => {
    const module = await createTestingModule([PaymentTransactionService]);
    service = module.get<PaymentTransactionService>(PaymentTransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
