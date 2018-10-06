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
        await this.redis.set(key, JSON.stringify(value), 'NX', 'EX', Math.floor(options.expires / 1000))
        return
      }

      if (options.notExists) {
        await this.redis.set(key, JSON.stringify(value), 'NX')
        return
      }

      if (options.expires) {
        await this.redis.set(key, JSON.stringify(value), 'EX', Math.floor(options.expires / 1000))
        return
      }
    }

    await this.redis.set(key, JSON.stringify(value))
  }

  async incr(key: string): Promise<void> {
    await this.redis.incr(key)
  }

  async decr(key: string): Promise<void> {
    await this.redis.decr(key)
  }

  async hincr(namespace: string, key: string): Promise<void> {
    await this.redis.hincrby(namespace, key, 1)
  }

  async hdecr(namespace: string, key: string): Promise<void> {
    await this.redis.hincrby(namespace, key, -1)
  }

  del(key: string): Promise<void> {
    return this.redis.del(key)
  }

  async hset<T>(namespace: string, key: string, value: T): Promise<void> {
    await this.redis.hset(namespace, key, value)
  }

  async hget<T>(namespace: string, key: string, defaultValue?: T): Promise<T> {
    return JSON.parse(await this.redis.hget(namespace, key)) || defaultValue
  }
}
