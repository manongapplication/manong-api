import { FirebaseService } from './firebase.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(async () => {
    const module = await createTestingModule([FirebaseService]);
    service = module.get<FirebaseService>(FirebaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
