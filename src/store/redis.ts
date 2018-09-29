/**
 * @file src/store/redis.ts
 * @description Redis-powered store.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Redis, RedisOptions } from 'ioredis'

import { Store } from './store'

export class RedisStore implements Store {
  private readonly redis: Redis

  constructor(options: RedisOptions) {
    this.redis = new (require('ioredis'))(options)
  }

  get(key: string): Promise<string> {
    return this.redis.get(key)
  }

  async set(key: string, value: string): Promise<void> {
    await this.redis.set(key, value)
  }

  del(key: string): Promise<void> {
    return this.redis.del(key)
  }
}
