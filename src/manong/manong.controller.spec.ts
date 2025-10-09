import { ManongController } from './manong.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ManongController', () => {
  let controller: ManongController;

  beforeEach(async () => {
    const module = await createTestingModule([ManongController]);
    controller = module.get<ManongController>(ManongController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
