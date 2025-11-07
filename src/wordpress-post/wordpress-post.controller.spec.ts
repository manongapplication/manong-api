import { WordpressPostController } from './wordpress-post.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('WordpressPostController', () => {
  let controller: WordpressPostController;

  beforeEach(async () => {
    const module = await createTestingModule([WordpressPostController]);
    controller = module.get<WordpressPostController>(WordpressPostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
