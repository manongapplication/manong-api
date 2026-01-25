import { ManongWalletTransactionService } from './manong-wallet-transaction.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ManongWalletTransactionService', () => {
  let service: ManongWalletTransactionService;

  beforeEach(async () => {
    const module = await createTestingModule([ManongWalletTransactionService]);
    service = module.get<ManongWalletTransactionService>(
      ManongWalletTransactionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
