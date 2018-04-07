/**
 * @file src/bulkhead/from-semaphore.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Semaphore } from '..'
import { AsyncFunction } from '../types'
import { defaults, BulkheadOptions } from './types'

export function fromSemaphore<T>(
  size: number,
  worker: AsyncFunction<T>,
  _options?: BulkheadOptions
): AsyncFunction<T> {
  const options = defaults(_options)
  const s = new Semaphore(size)

  return async function bulkheadWrapper(...args: any[]): Promise<T> {
    const unlock = await s.lock(options.failFast)
    const retval = await worker(...args)
    await unlock()
    return retval
  }
}
