import { ManongService } from './manong.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ManongService', () => {
  let service: ManongService;

  beforeEach(async () => {
    const module = await createTestingModule([ManongService]);
    service = module.get<ManongService>(ManongService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
