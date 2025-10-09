import { PaymongoService } from './paymongo.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('PaymongoService', () => {
  let service: PaymongoService;

  beforeEach(async () => {
    const module = await createTestingModule([PaymongoService]);
    service = module.get<PaymongoService>(PaymongoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
