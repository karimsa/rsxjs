/**
 * @file src/bulkhead/from-semaphore.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Semaphore } from '..'
import { AsyncFunction } from '../types'

export function fromSemaphore<T>(size: number, worker: AsyncFunction<T>): AsyncFunction<T> {
  const s = new Semaphore(size)

  return async function bulkheadWrapper(...args: any[]): Promise<T> {
    const unlock = await s.lock()
    const retval = await worker(...args)
    await unlock()
    return retval
  }
}
