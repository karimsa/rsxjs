/**
 * @file src/deferral/from-async.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { AsyncFunction } from '../types'
import { AsyncDeferral, DeferredOperation } from './types'

export function fromAsync<T>(fn: AsyncDeferral<T>): AsyncFunction<T> {
  return async function deferralWrapper(this: any, ...args: any[]): Promise<T> {
    const deferral = new DeferredOperation()

    try {
      const retval = fn.call(this, deferral.defer.bind(deferral), ...args)
      await deferral.cleanup()
      return retval
    } catch (err) {
      Error.captureStackTrace(err, deferralWrapper)
      await deferral.cleanup()
      throw err
    }
  }
}
