import { Test, TestingModule } from '@nestjs/testing';
import { GoogleGeocodingService } from './google-geocoding.service';

describe('GoogleGeocodingService', () => {
  let service: GoogleGeocodingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleGeocodingService],
    }).compile();

    service = module.get<GoogleGeocodingService>(GoogleGeocodingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
