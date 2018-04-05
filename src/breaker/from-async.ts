/**
 * @file src/breaker/from-async.ts
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
  AsyncFunction,
} from '../types'

import createDebug = require('debug')
const debug = createDebug('rsxjs')

export function fromAsync<T = any>(
  originalFn: AsyncFunction<T>,
  _options?: BreakerOptionsGiven
): AsyncFunction<T> {
  const options = defaults(_options)
  const state: BreakerStateObject = {
    numErrors: 0,
    lastError: undefined,
    lastErrorTime: 0,
  }

  return async function asyncBreaker(...args: any[]): Promise<T> {
    const breakerState = getBreakerState(state, options)
    debug('breaker state => %s', breakerState)

    if (breakerState === BreakerState.CLOSED) {
      throw state.lastError
    }

    try {
      const retValue = await originalFn(...args)

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
