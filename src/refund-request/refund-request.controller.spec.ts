import { RefundRequestController } from './refund-request.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('RefundRequestController', () => {
  let controller: RefundRequestController;

  beforeEach(async () => {
    const module = await createTestingModule([RefundRequestController]);
    controller = module.get<RefundRequestController>(RefundRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
