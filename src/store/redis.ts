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

  async get<T>(key: string): Promise<T> {
    return JSON.parse(await this.redis.get(key))
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.redis.set(key, JSON.stringify(value))
  }

  async setnx<T>(key: string, value: T): Promise<boolean> {
    if (await this.redis.set(key, JSON.stringify(value), 'nx') === null) {
      return false
    }

    return true
  }

  del(key: string): Promise<void> {
    return this.redis.del(key)
  }
}
