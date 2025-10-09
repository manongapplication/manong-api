import { PaymongoController } from './paymongo.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('PaymongoController', () => {
  let controller: PaymongoController;

  beforeEach(async () => {
    const module = await createTestingModule([PaymongoController]);
    controller = module.get<PaymongoController>(PaymongoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
