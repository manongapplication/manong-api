import { UserPaymentMethodService } from './user-payment-method.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('UserPaymentMethodService', () => {
  let service: UserPaymentMethodService;

  beforeEach(async () => {
    const module = await createTestingModule([UserPaymentMethodService]);
    service = module.get<UserPaymentMethodService>(UserPaymentMethodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
