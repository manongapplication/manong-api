import { UserNotificationService } from './user-notification.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('UserNotificationService', () => {
  let service: UserNotificationService;

  beforeEach(async () => {
    const module = await createTestingModule([UserNotificationService]);
    service = module.get<UserNotificationService>(UserNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
