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
import { Callback } from '../types'

import createDebug = require('debug')
const debug = createDebug('rsxjs')

export function fromCallback(
  originalFn: Function,
  _options?: BreakerOptionsGiven
): Function {
  const options = defaults(_options)
  const state: BreakerStateObject = {
    numErrors: 0,
    lastError: undefined,
    lastErrorTime: 0,
  }

  return function callbackBreaker(...args: any[]) {
    const callback: Callback = args.pop()

    const breakerState = getBreakerState(state, options)
    debug('breaker state (%j) => %s', state, breakerState)

    if (state.lastError && breakerState === BreakerState.CLOSED) {
      return callback(state.lastError)
    }

    const breakerCallback: Callback = function (err, ...cbArgs) {
      if (err) {
        ++state.numErrors
        state.lastError = err
        state.lastErrorTime = Date.now()
      } else {
        state.numErrors = 0
        state.lastError = undefined
        state.lastErrorTime = 0
      }

      return callback(err, ...cbArgs)
    }

    return originalFn(...args, breakerCallback)
  }
}
