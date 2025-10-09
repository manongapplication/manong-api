import { PaymentMethodService } from './payment-method.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;

  beforeEach(async () => {
    const module = await createTestingModule([PaymentMethodService]);
    service = module.get<PaymentMethodService>(PaymentMethodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
