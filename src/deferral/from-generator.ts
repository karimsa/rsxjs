/**
 * @file src/deferral/from-async.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { co } from '../coroutine'
import { AsyncFunction } from '../types'
import { DeferredOperation } from './types'

import createDebug from 'debug'
const debug = createDebug('rsxjs')

export function fromGenerator<T>(fn: GeneratorFunction): AsyncFunction<T> {
  async function deferralWrapper(this: any, ...args: any[]): Promise<T> {
    const deferral = new DeferredOperation()

    try {
      return await co<T>(() => fn.call(this, deferral.defer.bind(deferral), ...args))
    } finally {
      debug(`unwinding deferred operations`)
      await deferral.cleanup()
    }
  }

  return deferralWrapper
}
