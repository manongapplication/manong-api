import { ProviderVerificationController } from './provider-verification.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ProviderVerificationController', () => {
  let controller: ProviderVerificationController;

  beforeEach(async () => {
    const module = await createTestingModule([ProviderVerificationController]);
    controller = module.get<ProviderVerificationController>(
      ProviderVerificationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
