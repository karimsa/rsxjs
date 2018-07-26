/**
 * @file src/breaker/from-sync.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import {
  defaults,
  BreakerState,
  getBreakerState,
  BreakerStateObject,
  BreakerOptionsGiven,
} from './types'
import {
  SyncFunction,
} from '../types'

import createDebug from 'debug'
const debug = createDebug('rsxjs')

export function fromSync<T = any>(
  originalFn: SyncFunction<T>,
  _options?: BreakerOptionsGiven
): SyncFunction<T> {
  const options = defaults(_options)
  const state: BreakerStateObject = {
    numErrors: 0,
    lastError: undefined,
    lastErrorTime: 0,
  }

  return function syncBreaker(...args: any[]): T {
    const breakerState = getBreakerState(state, options)
    debug('breaker state => %s', breakerState)

    if (breakerState === BreakerState.CLOSED) {
      throw state.lastError
    }

    try {
      const retValue = originalFn(...args)

      state.numErrors = 0
      state.lastError = undefined
      state.lastErrorTime = 0

      return retValue
    } catch (err) {
      ++state.numErrors
      state.lastError = err
      state.lastErrorTime = Date.now()

      throw err
    }
  }
}
