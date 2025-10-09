import { ImageUploadController } from './image-upload.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ImageUploadController', () => {
  let controller: ImageUploadController;

  beforeEach(async () => {
    const module = await createTestingModule([ImageUploadController]);
    controller = module.get<ImageUploadController>(ImageUploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
