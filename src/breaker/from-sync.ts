/**
 * @file src/breaker/from-sync.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import {
  defaults,
  BreakerOptionsGiven,
  CircuitBreaker,
} from './types'
import {
  SyncFunction,
  AsyncFunction,
} from '../types'

export function fromSync<T = any>(
  originalFn: SyncFunction<T>,
  _options?: BreakerOptionsGiven
): AsyncFunction<T> {
  const options = defaults(_options)
  const breaker = new CircuitBreaker<T>(options)

  return function syncBreaker(this: any, ...args: any[]): Promise<T> {
    return breaker.attempt(() => originalFn.apply(this, args))
  }
}
