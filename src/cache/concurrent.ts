/**
 * @file src/cache/concurrent.ts
 * @description Cache that optimizes for concurrency.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import weak from 'weak'
import createDebugger from 'debug'
const debug = createDebugger('rsxjs')

import { Cache } from './types'

function createSweepListener(cache: ConcurrentCache, key: string): (() => void) {
  return function() {
    debug('garbage collecting: %s', key)
    cache.remove(key)
  }
}

export interface ConcurrentCacheOptions {
  expiry?: number
}

export class ConcurrentCache implements Cache {
  private readonly weakCache = new Map<string, any>()
  private readonly expiry: number

  constructor(options: ConcurrentCacheOptions) {
    this.expiry = (options || {}).expiry || 1000
  }

  async get<T>(key: string): Promise<{ value: void, ok: false } | { value: T, ok: true }> {
    const weakRef = this.weakCache.get(key)
    if (this.weakCache.has(key) && !weak.isDead(weakRef)) {
      return {
        ok: true,
        value: weak.get(weakRef) as any,
      }
    }

    return {
      ok: false,
      value: undefined,
    }
  }

  async set<T extends object>(key: string, value: T): Promise<void> {
    const sweep = createSweepListener(this, key)
    this.weakCache.set(key, weak(value, sweep))
    debug(`${key} will be forcefully swept in ${this.expiry}ms`)
    setTimeout(sweep, this.expiry)
  }

  async remove(key: string): Promise<void> {
    this.weakCache.delete(key)
  }
}
