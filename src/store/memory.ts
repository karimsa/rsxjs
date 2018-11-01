/**
 * @file src/store/memory.ts
 * @description Memory store.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { makeChan, chan } from '../channel'
import { Store, SetOptions } from './store'

// use a universal map to stay consistent with distributed
// maps like redis
let map: Map<string, any>

export class MemoryStore implements Store {
  private readonly map: Map<string, any> = map = map || new Map()

  async incr(key: string): Promise<number> {
    this.map.set(key, (this.map.get(key)|0) + 1)
    return this.map.get(key)
  }

  async decr(key: string): Promise<number> {
    this.map.set(key, (this.map.get(key)|0) - 1)
    return this.map.get(key)
  }

  async get<T>(key: string): Promise<T | void> {
    return this.map.get(key)
  }

  async set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    if (options) {
      if (options.notExists && this.map.has(key)) {
        return
      }

      if (options.expires !== undefined) {
        setTimeout(() => this.map.delete(key), options.expires)
      }
    }

    this.map.set(key, value)
  }

  async del(key: string): Promise<void> {
    this.map.delete(key)
  }

  async hget<T>(namespace: string, key: string): Promise<T | void>;
  async hget<T>(namespace: string, key: string, defaultValue: T): Promise<T>;

  async hget<T>(namespace: string, key: string, defaultValue?: T): Promise<T | void> {
    const map: Map<string, any> | void = this.map.get(namespace)
    if (!map) {
      return defaultValue
    }

    return map.get(key) || defaultValue
  }

  async hset<T>(namespace: string, key: string, value: T): Promise<void> {
    const map: Map<string, any> = this.map.get(namespace) || new Map<string, any>()
    this.map.set(namespace, map)
    map.set(key, value)
  }

  async hincr(namespace: string, key: string): Promise<number> {
    const ctr = 1 + (await this.hget(namespace, key, 0))
    this.hset(namespace, key, ctr)
    return ctr
  }

  async hdecr(namespace: string, key: string): Promise<number> {
    const ctr = -1 + (await this.hget(namespace, key, 0))
    await this.hset(namespace, key, ctr)
    return ctr
  }

  async rpush<T>(listName: string, value: T): Promise<void> {
    if (!this.map.has(listName)) {
      this.map.set(listName, makeChan({
        bufferSize: 1e9,
      }))
    }

    const q: chan<any> = this.map.get(listName)
    await q.put(value)
  }

  async lpush<T>(listName: string, value: T): Promise<void> {
    if (!this.map.has(listName)) {
      this.map.set(listName, makeChan({
        bufferSize: 1e9,
      }))
    }

    const q: chan<any> = this.map.get(listName)
    await q.lput(value)
  }

  async rpop<T>(listName: string): Promise<T | void> {
    const q: chan<any> = this.map.get(listName)
    if (q) {
      return q.rselect().value
    }
  }

  async lpop<T>(listName: string): Promise<T | void> {
    const q: chan<any> = this.map.get(listName)
    if (q) {
      return q.select().value
    }
  }

  async brpop<T>(listName: string, timeout: number): Promise<T | void> {
    const q: chan<any> = this.map.get(listName)
    if (q) {
      return (await q.rtake(timeout)).value
    }
  }

  async blpop<T>(listName: string, timeout: number): Promise<T | void> {
    const q: chan<any> = this.map.get(listName)
    if (q) {
      return (await q.take(timeout)).value
    }
  }
}
