/**
 * @file src/mutex/from-generator.ts
 * @description Wrap a mutex around a generator to create a coroutine.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Mutex } from './mutex'
import { co } from '../coroutine'
import { MutexOptions } from './types'
import { AsyncFunction } from '../types'

export function fromGenerator<T>(
  fn: GeneratorFunction,
  options?: MutexOptions
): AsyncFunction<T> {
  const m = new Mutex(options)

  return async function mutexWrappedFunction(this: any, ...args: any[]): Promise<T> {
    const unlock = await m.lock()

    try {
      return await co<T>(() => fn.apply(this, args))
    } finally {
      unlock()
    }
  }
}
