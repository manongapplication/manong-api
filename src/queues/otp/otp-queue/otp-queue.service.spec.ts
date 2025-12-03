import { OtpQueueService } from './otp-queue.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('OtpQueueService', () => {
  let service: OtpQueueService;

  beforeEach(async () => {
    const module = await createTestingModule([OtpQueueService]);
    service = module.get<OtpQueueService>(OtpQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
