import { ServiceRequestController } from './service-request.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ServiceRequestController', () => {
  let controller: ServiceRequestController;

  beforeEach(async () => {
    const module = await createTestingModule([ServiceRequestController]);
    controller = module.get<ServiceRequestController>(ServiceRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
