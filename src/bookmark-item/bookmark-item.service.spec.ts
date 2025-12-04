import { createTestingModule } from 'test/utils/create-testing-module';
import { BookmarkItemService } from './bookmark-item.service';

describe('BookmarkItemService', () => {
  let service: BookmarkItemService;

  beforeEach(async () => {
    const module = await createTestingModule([BookmarkItemService]);
    service = module.get<BookmarkItemService>(BookmarkItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
