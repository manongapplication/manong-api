import { ManongWalletController } from './manong-wallet.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ManongWalletController', () => {
  let controller: ManongWalletController;

  beforeEach(async () => {
    const module = await createTestingModule([ManongWalletController]);
    controller = module.get<ManongWalletController>(ManongWalletController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
