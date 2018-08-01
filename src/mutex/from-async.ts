/**
 * @file src/mutex/from-async.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Mutex } from './mutex'
import { AsyncFunction } from '../types'
import { defaults, MutexOptionsGiven } from './types'

export function fromAsync<T>(
  fn: AsyncFunction<T>,
  options?: MutexOptionsGiven
): AsyncFunction<T> {
  const m = new Mutex()

  return async function mutexWrappedFunction(this: any, ...args: any[]): Promise<T> {
    const unlock = await m.lock(defaults(options).failFast)

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
