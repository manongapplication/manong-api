import { ManongWalletService } from './manong-wallet.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ManongWalletService', () => {
  let service: ManongWalletService;

  beforeEach(async () => {
    const module = await createTestingModule([ManongWalletService]);
    service = module.get<ManongWalletService>(ManongWalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
