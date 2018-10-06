/**
 * @file src/breaker/from-sync.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import {
  defaults,
  BreakerOptionsGiven,
  BreakerStateObject,
} from './types'
import {
  SyncFunction,
} from '../types'

export function fromSync<T = any>(
  originalFn: SyncFunction<T>,
  _options?: BreakerOptionsGiven
): SyncFunction<T> {
  const options = defaults(_options)
  const state: BreakerStateObject = {
    numErrors: 0,
    lastError: 'Unknown error',
    lastErrorTime: 0,
  }

  return function syncBreaker(this: any, ...args: any[]): T {
    const callback = args.pop()
    if (typeof callback !== 'function') {
      throw new Error(`Last argument should be a callback function, not ${typeof callback}`)
    }

    if (
      state.numErrors >= options.maxErrors &&
      Date.now() - state.lastErrorTime < options.timeout
    ) {
      throw new Error(state.lastError)
    }

    try {
      const result = originalFn.apply(this, args)
      state.numErrors = 0
      state.lastErrorTime = 0
      return result
    } catch (err) {
      ++state.numErrors
      state.lastError = err
      state.lastErrorTime = Date.now()
      throw err
    }
  }
}
