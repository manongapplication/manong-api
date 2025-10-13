import { UrgencyLevelService } from './urgency-level.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('UrgencyLevelService', () => {
  let service: UrgencyLevelService;

  beforeEach(async () => {
    const module = await createTestingModule([UrgencyLevelService]);
    service = module.get<UrgencyLevelService>(UrgencyLevelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
