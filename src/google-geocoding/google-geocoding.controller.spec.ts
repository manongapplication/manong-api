import { GoogleGeocodingController } from './google-geocoding.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('GoogleGeocodingController', () => {
  let controller: GoogleGeocodingController;

  beforeEach(async () => {
    const module = await createTestingModule([GoogleGeocodingController]);
    controller = module.get<GoogleGeocodingController>(
      GoogleGeocodingController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
