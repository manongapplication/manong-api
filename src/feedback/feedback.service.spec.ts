import { FeedbackService } from './feedback.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(async () => {
    const module = await createTestingModule([FeedbackService]);
    service = module.get<FeedbackService>(FeedbackService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
