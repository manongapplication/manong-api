import { UserNotificationController } from './user-notification.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('UserNotificationController', () => {
  let controller: UserNotificationController;

  beforeEach(async () => {
    const module = await createTestingModule([UserNotificationController]);
    controller = module.get<UserNotificationController>(
      UserNotificationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
