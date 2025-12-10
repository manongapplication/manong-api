import { createTestingModule } from 'test/utils/create-testing-module';
import { AppVersionService } from './app-version.service';

describe('AppVersionService', () => {
  let service: AppVersionService;

  beforeEach(async () => {
    const module = await createTestingModule([AppVersionService]);
    service = module.get<AppVersionService>(AppVersionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
