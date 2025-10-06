import { Test, TestingModule } from '@nestjs/testing';
import { UserPaymentMethodController } from './user-payment-method.controller';

describe('UserPaymentMethodController', () => {
  let controller: UserPaymentMethodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPaymentMethodController],
    }).compile();

    controller = module.get<UserPaymentMethodController>(
      UserPaymentMethodController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
