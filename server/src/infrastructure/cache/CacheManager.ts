import { Redis } from 'ioredis';
import { logger } from '../../utils/logger.js';

export class CacheManager {
  private static instance: CacheManager;
  private redis: Redis;
  private defaultTTL: number = 300; // 5 minutes

  private constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.setupListeners();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private setupListeners(): void {
    this.redis.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const json = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, json);
      } else {
        await this.redis.setex(key, this.defaultTTL, json);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  // Specific cache helpers
  async getMeasurements(userId: string, params: any): Promise<any | null> {
    const key = `measurements:${userId}:${JSON.stringify(params)}`;
    return this.get(key);
  }

  async setMeasurements(userId: string, params: any, data: any): Promise<void> {
    const key = `measurements:${userId}:${JSON.stringify(params)}`;
    await this.set(key, data, 60); // 1 minute TTL
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.deletePattern(`measurements:${userId}:*`);
    await this.deletePattern(`portraits:${userId}:*`);
  }

  // Rate limiting
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    const current = await this.redis.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= limit) {
      const ttl = await this.redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        reset: Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000),
      };
    }

    await this.redis.multi()
      .incr(key)
      .expire(key, windowSeconds)
      .exec();

    return {
      allowed: true,
      remaining: limit - count - 1,
      reset: Date.now() + windowSeconds * 1000,
    };
  }
}
