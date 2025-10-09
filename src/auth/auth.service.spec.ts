import { AuthService } from './auth.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await createTestingModule([AuthService]);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
