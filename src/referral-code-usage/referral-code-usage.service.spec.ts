import { ReferralCodeUsageService } from './referral-code-usage.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ReferralCodeUsageService', () => {
  let service: ReferralCodeUsageService;

  beforeEach(async () => {
    const module = await createTestingModule([ReferralCodeUsageService]);
    service = module.get<ReferralCodeUsageService>(ReferralCodeUsageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
