/**
 * @file src/deferral/from-async.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { AsyncFunction } from '../types'
import { DeferredOperation } from './types'

import createDebug from 'debug'
const debug = createDebug('rsxjs')

export function fromGenerator<T>(fn: GeneratorFunction): AsyncFunction<T> {
  async function deferralWrapper(this: any, ...args: any[]): Promise<T> {
    const deferral = new DeferredOperation()

    try {
      const it = fn.call(this, deferral.defer.bind(deferral), ...args)
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
      debug(`unwinding deferred operations`)
      await deferral.cleanup()
    }
  }

  return deferralWrapper
}
