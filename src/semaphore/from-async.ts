/**
 * @file src/semaphore/from-async.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Semaphore } from './semaphore'
import { SemaphoreOptionsGiven, defaults } from './types'
import { AsyncFunction } from '../types'

export function fromAsync<T>(fn: AsyncFunction<T>, _options: SemaphoreOptionsGiven): AsyncFunction<T> {
  const options = defaults(_options)
  const s = new Semaphore(options)

  return async function mutexWrappedFunction(this: any, ...args: any[]): Promise<T> {
    const unlock = await s.lock(options.failFast)

    try {
      const result = await fn.apply(this, args)
      unlock()
      return result
    } catch (err) {
      unlock()
      throw err
    }
  }
}
