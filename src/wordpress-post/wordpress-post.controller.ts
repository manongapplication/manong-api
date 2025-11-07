import { Controller, Get } from '@nestjs/common';
import { WordpressPostService } from './wordpress-post.service';

@Controller('api/wordpress-post')
export class WordpressPostController {
  constructor(private readonly wordpressPostService: WordpressPostService) {}

  @Get()
  async fetchPosts() {
    const result = await this.wordpressPostService.fetchPosts();

    return {
      success: true,
      data: result,
      message: 'Wordpress post successfully fetched!',
    };
  }
}
