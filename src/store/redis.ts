/**
 * @file src/store/redis.ts
 * @description Redis-powered store.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Redis, RedisOptions } from 'ioredis'
import createDebugger from 'debug'

import { Store, SetOptions, StoreTx } from './store'

const debug = createDebugger('rsxjs')

function parse(text: string | null): any {
  if (text) {
    return JSON.parse(text)
  }
}

export class RedisStore implements Store {
  private readonly redis: Redis

  constructor(options: RedisOptions) {
    this.redis = new (require('ioredis'))(options)
  }

  async get<T>(key: string): Promise<T> {
    return parse(await this.redis.get(key))
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

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async hset<T>(namespace: string, key: string, value: T): Promise<void> {
    await this.redis.hset(namespace, key, JSON.stringify(value))
  }

  async hget<T>(namespace: string, key: string, defaultValue?: T): Promise<T | void> {
    try {
      return parse(await this.redis.hget(namespace, key)) || defaultValue
    } catch (err) {
      debug(`failed to hget ${namespace} ${key} => ${err}`)
      return defaultValue
    }
  }

  rpush(listName: string, value: any): Promise<void> {
    return this.redis.rpush(listName, JSON.parse(value))
  }

  lpush(listName: string, value: any): Promise<void> {
    return this.redis.lpush(listName, JSON.parse(value))
  }

  async rpop<T>(listName: string): Promise<T | void> {
    return JSON.parse(await this.redis.rpop(listName))
  }

  async lpop<T>(listName: string): Promise<T | void> {
    return JSON.parse(await this.redis.lpop(listName))
  }

  async brpop<T>(listName: string, timeout: number): Promise<T | void> {
    return JSON.parse(await this.redis.brpop(listName, String(timeout)))
  }

  async blpop<T>(listName: string, timeout: number): Promise<T | void> {
    return JSON.parse(await this.redis.blpop(listName, String(timeout)))
  }

  multi(): StoreTx {
    const tx = this.redis.multi()

    return {
      hset(ns: string, key: string, value: any) {
        tx.hset(ns, key, value)
        return this
      },

      hincr(ns: string, key: string) {
        tx.hincrby(ns, key, 1)
        return this
      },

      exec() {
        return tx.exec()
      },
    }
  }
}
