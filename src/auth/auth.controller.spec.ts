import { AuthController } from './auth.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module = await createTestingModule([AuthController]);
    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
