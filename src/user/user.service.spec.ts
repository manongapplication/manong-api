import { UserService } from './user.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module = await createTestingModule([UserService]);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
