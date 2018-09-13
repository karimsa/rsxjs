/**
 * @file src/cache/index.ts
 * @description Cache implementations for rsxjs.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import * as Mutex from '../mutex'
import { AsyncFunction } from '../types'
import { Cache, CacheOptions } from './types'

import { ConcurrentCache } from './concurrent'

function createCache(options: CacheOptions): Cache {
  switch (options.type) {
    case 'concurrent': return new ConcurrentCache()

    default: throw new Error(`Unrecognized cache type: ${options.type}`)
  }
}

function hash(args: any): string {
  return JSON.stringify(args)
}

export function fromAsync<T extends object>(
  fn: AsyncFunction<T>,
  options: CacheOptions
): AsyncFunction<T> {
  const cache = createCache(options)

  return Mutex.fromAsync<T>(async function cacheHandler(...args: any[]): Promise<T> {
    const argHash = hash(args)

    const result = await cache.get<T>(argHash)
    if (result.ok) {
      return result.value
    }

    const value = await fn(...args)
    await cache.set<T>(argHash, value)
    return value
  })
}
