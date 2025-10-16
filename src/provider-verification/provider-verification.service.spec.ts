import { createTestingModule } from 'test/utils/create-testing-module';
import { ProviderVerificationService } from './provider-verification.service';

describe('ProviderVerificationService', () => {
  let service: ProviderVerificationService;

  beforeEach(async () => {
    const module = await createTestingModule([ProviderVerificationService]);
    service = module.get<ProviderVerificationService>(
      ProviderVerificationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
