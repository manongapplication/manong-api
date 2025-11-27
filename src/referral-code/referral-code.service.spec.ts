import { ReferralCodeService } from './referral-code.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ReferralCodeService', () => {
  let service: ReferralCodeService;

  beforeEach(async () => {
    const module = await createTestingModule([ReferralCodeService]);
    service = module.get<ReferralCodeService>(ReferralCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
