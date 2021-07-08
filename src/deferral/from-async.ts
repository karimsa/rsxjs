/**
 * @file src/deferral/from-async.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { AsyncFunction } from '../types'
import { AsyncDeferral, DeferredOperation } from './types'

import createDebug from 'debug'
const debug = createDebug('rsxjs')

export function fromAsync<T>(fn: AsyncDeferral<T>): AsyncFunction<T> {
	async function deferralWrapper(this: any, ...args: any[]): Promise<T> {
		const deferral = new DeferredOperation()

		try {
			const retval = await fn.call(this, deferral.defer.bind(deferral), ...args)
			debug(`unwinding deferred operations`)
			await deferral.cleanup()
			return retval
		} catch (err) {
			debug(`unwinding deferred operations (failure)`)
			Error.captureStackTrace(err, deferralWrapper)
			await deferral.cleanup()
			throw err
		}
	}

	return deferralWrapper
}
