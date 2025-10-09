import { TwilioService } from './twilio.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('TwilioService', () => {
  let service: TwilioService;

  beforeEach(async () => {
    const module = await createTestingModule([TwilioService]);
    service = module.get<TwilioService>(TwilioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
