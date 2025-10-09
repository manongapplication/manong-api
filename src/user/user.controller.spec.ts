import { UserController } from './user.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module = await createTestingModule([UserController]);
    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
