/**
 * @file src/store/memory.ts
 * @description Memory store.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { makeChan, chan } from '../channel'
import { Store, SetOptions, StoreTx } from './store'

// use a universal map to stay consistent with distributed
// maps like redis
let map: Map<string, any>

class SyncMemoryStore {
  private readonly map: Map<string, any> = map = map || new Map()

  hget(namespace: string, key: string, defaultValue?: any) {
    const map: Map<string, any> | void = this.map.get(namespace)
    if (!map) {
      return defaultValue
    }

    return map.get(key) || defaultValue
  }

  hset<T>(namespace: string, key: string, value: T) {
    const map: Map<string, any> = this.map.get(namespace) || new Map<string, any>()
    this.map.set(namespace, map)
    map.set(key, value)
  }

  hincr(namespace: string, key: string) {
    return this.hset(namespace, key, 1 + this.hget(namespace, key, 0))
  }

  hdecr(namespace: string, key: string) {
    return this.hset(namespace, key, -1 + this.hget(namespace, key, 0))
  }
}

export class MemoryStore implements Store {
  private readonly map: Map<string, any> = map = map || new Map()
  private readonly _store = new SyncMemoryStore()

  async incr(key: string): Promise<void> {
    this.map.set(key, (this.map.get(key)|0) + 1)
  }

  async decr(key: string): Promise<void> {
    this.map.set(key, (this.map.get(key)|0) - 1)
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
    return this._store.hget(namespace, key, defaultValue)
  }

  async hset<T>(namespace: string, key: string, value: T): Promise<void> {
    return this._store.hset(namespace, key, value)
  }

  async hincr(namespace: string, key: string): Promise<void> {
    return this._store.hincr(namespace, key)
  }

  async hdecr(namespace: string, key: string): Promise<void> {
    return this._store.hdecr(namespace, key)
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

  multi() {
    const cmdBuffer: {
      cmd: string
      args: any[]
    }[] = []

    const store = this._store
    const tx: StoreTx = {
      hset(ns, key, value) { return addToBuffer('hset', ns, key, value) },
      hincr(ns, key) { return addToBuffer('hincrby', ns, key, 1) },

      async exec() {
        for (const { cmd, args } of cmdBuffer) {
          switch (cmd) {
            case 'hset':
              store.hset(args[0], args[1], args[2])
              break

            case 'hincr':
              store.hincr(args[0], args[1])
              break

            default:
              throw new Error(`Unrecognized command: ${cmd}`)
          }
        }
      },
    }

    function addToBuffer(cmd: string, ...args: any[]) {
      cmdBuffer.push({ cmd, args })
      return tx
    }

    return tx
  }
}
