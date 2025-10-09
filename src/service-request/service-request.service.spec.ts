import { ServiceRequestService } from './service-request.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ServiceRequestService', () => {
  let service: ServiceRequestService;

  beforeEach(async () => {
    const module = await createTestingModule([ServiceRequestService]);
    service = module.get<ServiceRequestService>(ServiceRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
