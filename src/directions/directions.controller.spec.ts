import { DirectionsController } from './directions.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('DirectionsController', () => {
  let controller: DirectionsController;

  beforeEach(async () => {
    const module = await createTestingModule([DirectionsController]);
    controller = module.get<DirectionsController>(DirectionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
