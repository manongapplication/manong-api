import { OtpProcessorService } from './otp-processor.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('OtpProcessorService', () => {
  let service: OtpProcessorService;

  beforeEach(async () => {
    const module = await createTestingModule([OtpProcessorService]);
    service = module.get<OtpProcessorService>(OtpProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
