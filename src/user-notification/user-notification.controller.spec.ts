import { Test, TestingModule } from '@nestjs/testing';
import { UserNotificationController } from './user-notification.controller';

describe('UserNotificationController', () => {
  let controller: UserNotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserNotificationController],
    }).compile();

    controller = module.get<UserNotificationController>(
      UserNotificationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
