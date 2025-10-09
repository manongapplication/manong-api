import { FcmController } from './fcm.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('FcmController', () => {
  let controller: FcmController;

  beforeEach(async () => {
    const module = await createTestingModule([FcmController]);
    controller = module.get<FcmController>(FcmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
