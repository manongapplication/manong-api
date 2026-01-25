import { createTestingModule } from 'test/utils/create-testing-module';
import { ManongWalletTransactionController } from './manong-wallet-transaction.controller';

describe('ManongWalletTransactionController', () => {
  let controller: ManongWalletTransactionController;

  beforeEach(async () => {
    const module = await createTestingModule([
      ManongWalletTransactionController,
    ]);
    controller = module.get<ManongWalletTransactionController>(
      ManongWalletTransactionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
