import { DirectionsService } from './directions.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('DirectionsService', () => {
  let service: DirectionsService;

  beforeEach(async () => {
    const module = await createTestingModule([DirectionsService]);
    service = module.get<DirectionsService>(DirectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
