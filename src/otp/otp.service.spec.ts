import { OtpService } from './otp.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(async () => {
    const module = await createTestingModule([OtpService]);
    service = module.get<OtpService>(OtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
