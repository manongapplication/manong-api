import { ServiceSettingsController } from './service-settings.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ServiceSettingsController', () => {
  let controller: ServiceSettingsController;

  beforeEach(async () => {
    const module = await createTestingModule([ServiceSettingsController]);
    controller = module.get<ServiceSettingsController>(
      ServiceSettingsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
