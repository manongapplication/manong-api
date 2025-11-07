/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { WordpressPost } from './types/wordpress-post.types';

@Injectable()
export class WordpressPostService {
  private readonly logger = new Logger(WordpressPostService.name);

  async fetchPosts(): Promise<WordpressPost[]> {
    try {
      const baseUrl = 'https://manongapp.com';
      const { data } = await axios.get(`${baseUrl}/wp-json/wp/v2/posts`);

      if (!data || data.length === 0) return [];

      const posts: WordpressPost[] = data.map((post: any) => {
        const content = post.content?.rendered || '';
        let imageUrl: string | undefined;

        // Try to get main figure image first
        const figureMatch = content.match(
          /<figure[^>]*class=["'][^"']*wp-block-image[^"']*["'][^>]*>.*?<img[^>]+src=["']([^"']+)["']/i,
        );
        if (figureMatch && figureMatch[1]) {
          const src = figureMatch[1];
          if (
            src.startsWith('http') &&
            !src.includes('emoji') &&
            !src.includes('fbcdn.net')
          ) {
            imageUrl = src;
          }
        }

        // Fallback: first <img> in content
        if (!imageUrl) {
          const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) {
            const src = imgMatch[1];
            if (
              src.startsWith('http') &&
              !src.includes('emoji') &&
              !src.includes('fbcdn.net')
            ) {
              imageUrl = src;
            }
          }
        }

        return {
          id: post.id,
          title: post.title?.rendered || '',
          excerpt: post.excerpt?.rendered || '',
          content,
          link: post.link || '',
          imageUrl, // guaranteed to be a URL or undefined
        };
      });

      return posts;
    } catch (e) {
      this.logger.error(`Error getting WordPress posts: ${e}`);
      return [];
    }
  }
}
