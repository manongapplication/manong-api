import { FeedbackController } from './feedback.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('FeedbackController', () => {
  let controller: FeedbackController;

  beforeEach(async () => {
    const module = await createTestingModule([FeedbackController]);
    controller = module.get<FeedbackController>(FeedbackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
