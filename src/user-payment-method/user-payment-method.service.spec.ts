import { Test, TestingModule } from '@nestjs/testing';
import { UserPaymentMethodService } from './user-payment-method.service';

describe('UserPaymentMethodService', () => {
  let service: UserPaymentMethodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPaymentMethodService],
    }).compile();

    service = module.get<UserPaymentMethodService>(UserPaymentMethodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
