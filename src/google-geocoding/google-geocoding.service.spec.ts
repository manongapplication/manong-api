import { GoogleGeocodingService } from './google-geocoding.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('GoogleGeocodingService', () => {
  let service: GoogleGeocodingService;

  beforeEach(async () => {
    const module = await createTestingModule([GoogleGeocodingService]);
    service = module.get<GoogleGeocodingService>(GoogleGeocodingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
