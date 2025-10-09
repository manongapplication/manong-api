import { ServiceItemService } from './service-item.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ServiceItemService', () => {
  let service: ServiceItemService;

  beforeEach(async () => {
    const module = await createTestingModule([ServiceItemService]);
    service = module.get<ServiceItemService>(ServiceItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
