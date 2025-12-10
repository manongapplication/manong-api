import { createTestingModule } from 'test/utils/create-testing-module';
import { AppVersionController } from './app-version.controller';

describe('AppVersionController', () => {
  let controller: AppVersionController;

  beforeEach(async () => {
    const module = await createTestingModule([AppVersionController]);
    controller = module.get<AppVersionController>(AppVersionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
