import { UrgencyLevelController } from './urgency-level.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('UrgencyLevelController', () => {
  let controller: UrgencyLevelController;

  beforeEach(async () => {
    const module = await createTestingModule([UrgencyLevelController]);
    controller = module.get<UrgencyLevelController>(UrgencyLevelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
