import { createTestingModule } from 'test/utils/create-testing-module';
import { BookmarkItemController } from './bookmark-item.controller';

describe('BookmarkItemController', () => {
  let controller: BookmarkItemController;

  beforeEach(async () => {
    const module = await createTestingModule([BookmarkItemController]);
    controller = module.get<BookmarkItemController>(BookmarkItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
