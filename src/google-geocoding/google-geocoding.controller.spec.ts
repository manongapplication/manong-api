import { Test, TestingModule } from '@nestjs/testing';
import { GoogleGeocodingController } from './google-geocoding.controller';

describe('GoogleGeocodingController', () => {
  let controller: GoogleGeocodingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleGeocodingController],
    }).compile();

    controller = module.get<GoogleGeocodingController>(
      GoogleGeocodingController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
