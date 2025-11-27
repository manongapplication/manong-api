import { ReferralCodeUsageController } from './referral-code-usage.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ReferralCodeUsageController', () => {
  let controller: ReferralCodeUsageController;

  beforeEach(async () => {
    const module = await createTestingModule([ReferralCodeUsageController]);
    controller = module.get<ReferralCodeUsageController>(
      ReferralCodeUsageController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
