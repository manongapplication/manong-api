import { FcmService } from './fcm.service';
import { createTestingModule } from '../../test/utils/create-testing-module';

describe('FcmService', () => {
  let service: FcmService;

  beforeEach(async () => {
    const module = await createTestingModule([FcmService]);
    service = module.get<FcmService>(FcmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
