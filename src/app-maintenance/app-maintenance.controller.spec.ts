import { AppMaintenanceController } from './app-maintenance.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('AppMaintenanceController', () => {
  let controller: AppMaintenanceController;

  beforeEach(async () => {
    const module = await createTestingModule([AppMaintenanceController]);
    controller = module.get<AppMaintenanceController>(AppMaintenanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
