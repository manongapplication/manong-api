import { ServiceSettingsService } from './service-settings.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ServiceSettingsService', () => {
  let service: ServiceSettingsService;

  beforeEach(async () => {
    const module = await createTestingModule([ServiceSettingsService]);
    service = module.get<ServiceSettingsService>(ServiceSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
