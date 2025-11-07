import { WordpressPostService } from './wordpress-post.service';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('WordpressPostService', () => {
  let service: WordpressPostService;

  beforeEach(async () => {
    const module = await createTestingModule([WordpressPostService]);
    service = module.get<WordpressPostService>(WordpressPostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
