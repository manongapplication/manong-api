import { ImageUploadService } from './image-upload.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ImageUploadService', () => {
  let service: ImageUploadService;

  beforeEach(async () => {
    const module = await createTestingModule([ImageUploadService]);
    service = module.get<ImageUploadService>(ImageUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
