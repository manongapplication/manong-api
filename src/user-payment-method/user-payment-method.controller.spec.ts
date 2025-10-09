import { UserPaymentMethodController } from './user-payment-method.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('UserPaymentMethodController', () => {
  let controller: UserPaymentMethodController;

  beforeEach(async () => {
    const module = await createTestingModule([UserPaymentMethodController]);
    controller = module.get<UserPaymentMethodController>(
      UserPaymentMethodController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
