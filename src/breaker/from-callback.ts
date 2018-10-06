/**
 * @file src/breaker/from-sync.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import {
  defaults,
  BreakerOptionsGiven,
  CircuitBreaker,
} from './types'
import { Callback } from '../types'

export function fromCallback(
  originalFn: Function,
  _options?: BreakerOptionsGiven
): Function {
  const options = defaults(_options)
  const breaker = new CircuitBreaker(options)

  return function callbackBreaker(this: any, ...args: any[]) {
    const callback: Callback = args.pop()

    breaker.attempt(() => new Promise((resolve, reject) => {
      originalFn.call(this, ...args, async function(err: Error | null, result: any) {
        if (err) reject(err)
        else resolve(result)
      })
    })).then((result: any) => callback(null, result), (err: Error) => callback(err))
  }
}
