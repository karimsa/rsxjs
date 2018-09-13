/**
 * @file src/cache/concurrent.ts
 * @description Cache that optimizes for concurrency.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import weak from 'weak'

import { Cache } from './types'

function createSweepListener(cache: ConcurrentCache, key: string): (() => void) {
  return () => {
    cache.remove(key)
  }
}

export class ConcurrentCache implements Cache {
  private weakCache: {
    [key: string]: any
  } = {}

  async get<T>(key: string): Promise<{ value: void, ok: false } | { value: T, ok: true }> {
    const weakRef = this.weakCache[key]
    const ok = this.weakCache.hasOwnProperty(key) && !weak.isDead(this.weakCache[key])
    
    if (ok) {
      return {
        ok,
        value: weak.get(weakRef) as any,
      }
    }

    return { ok, value: undefined }
  }

  async set<T extends object>(key: string, value: T): Promise<void> {
    this.weakCache[key] = weak(value, createSweepListener(this, key))
  }

  async remove(key: string): Promise<void> {
    delete this.weakCache[key]
  }
}
