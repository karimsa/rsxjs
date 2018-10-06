/**
 * @file src/breaker/from-async.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import {
  AsyncFunction,
} from '../types'
import {
  defaults,
  CircuitBreaker,
  BreakerOptionsGiven,
} from './types'

export function fromAsync<T = any>(
  originalFn: AsyncFunction<T>,
  _options?: BreakerOptionsGiven
): AsyncFunction<T> {
  const options = defaults(_options)
  const breaker = new CircuitBreaker<T>(options)

  return function asyncBreaker(this: any, ...args: any[]): Promise<T> {
    return breaker.attempt(() => originalFn.apply(this, args))
  }
}
