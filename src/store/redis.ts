/**
 * @file src/store/redis.ts
 * @description Redis-powered store.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Redis, RedisOptions } from 'ioredis'

import { Store, SetOptions } from './store'

export class RedisStore implements Store {
  private readonly redis: Redis

  constructor(options: RedisOptions) {
    this.redis = new (require('ioredis'))(options)
  }

  async get<T>(key: string): Promise<T> {
    return JSON.parse(await this.redis.get(key))
  }

  async set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    if (options) {
      if (options.notExists && options.expires) {
        await this.redis.set(key, JSON.stringify(value), 'NX', 'EX', options.expires)
        return
      }

      if (options.notExists) {
        await this.redis.set(key, JSON.stringify(value), 'NX')
        return
      }

      if (options.expires) {
        await this.redis.set(key, JSON.stringify(value), 'EX', options.expires)
        return
      }
    }

    await this.redis.set(key, JSON.stringify(value))
  }

  del(key: string): Promise<void> {
    return this.redis.del(key)
  }
}
