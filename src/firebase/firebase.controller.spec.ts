import { FirebaseController } from './firebase.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('FirebaseController', () => {
  let controller: FirebaseController;

  beforeEach(async () => {
    const module = await createTestingModule([FirebaseController]);
    controller = module.get<FirebaseController>(FirebaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
