import { ReferralCodeController } from './referral-code.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ReferralCodeController', () => {
  let controller: ReferralCodeController;

  beforeEach(async () => {
    const module = await createTestingModule([ReferralCodeController]);
    controller = module.get<ReferralCodeController>(ReferralCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
