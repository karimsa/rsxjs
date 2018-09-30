/**
 * @file src/mutex/from-generator.ts
 * @description Wrap a mutex around a generator to create a coroutine.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Mutex } from './mutex'
import { AsyncFunction } from '../types'
import { MutexOptions } from './types'

export function fromGenerator<T>(
  fn: GeneratorFunction,
  options?: MutexOptions
): AsyncFunction<T> {
  const m = new Mutex(options)

  return async function mutexWrappedFunction(this: any, ...args: any[]): Promise<T> {
    const unlock = await m.lock()

    try {
      const it = fn.apply(this, args)
      let lastValue: any

      while (true) {
        const { value, done } = it.next(lastValue)
        lastValue = await value

        if (done) {
          break
        }
      }

      return lastValue
    } finally {
      unlock()
    }
  }
}
