/**
 * @file src/store/memory.ts
 * @description Memory store.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Store } from './store'

export class MemoryStore implements Store {
  private readonly map = new Map()

  async get<T>(key: string): Promise<T> {
    return this.map.get(key)
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.map.set(key, value)
  }

  async setnx<T>(key: string, value: T): Promise<boolean> {
    if (!this.map.has(key)) {
      this.map.set(key, value)
      return true
    }
    
    return false
  }

  async del(key: string): Promise<void> {
    this.map.delete(key)
  }
}
