import { RefundRequestService } from './refund-request.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('RefundRequestService', () => {
  let service: RefundRequestService;

  beforeEach(async () => {
    const module = await createTestingModule([RefundRequestService]);
    service = module.get<RefundRequestService>(RefundRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
