// redis/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  public readonly subscriber: Redis;
  public readonly publisher: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT!) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB!) || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Separate connections for pub/sub
    this.subscriber = this.redisClient.duplicate();
    this.publisher = this.redisClient.duplicate();
  }

  async onModuleInit() {
    // Test connection
    try {
      await this.redisClient.ping();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
    }
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
    await this.subscriber.quit();
    await this.publisher.quit();
  }

  // Helper methods
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.setex(key, ttl, JSON.stringify(value));
    } else {
      await this.redisClient.set(key, JSON.stringify(value));
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
