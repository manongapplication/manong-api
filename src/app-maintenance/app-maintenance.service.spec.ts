import { createTestingModule } from 'test/utils/create-testing-module';
import { AppMaintenanceService } from './app-maintenance.service';

describe('AppMaintenanceService', () => {
  let service: AppMaintenanceService;

  beforeEach(async () => {
    const module = await createTestingModule([AppMaintenanceService]);
    service = module.get<AppMaintenanceService>(AppMaintenanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
