import { ServiceItemController } from './service-item.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ServiceItemController', () => {
  let controller: ServiceItemController;

  beforeEach(async () => {
    const module = await createTestingModule([ServiceItemController]);
    controller = module.get<ServiceItemController>(ServiceItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
