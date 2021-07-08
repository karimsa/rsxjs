/**
 * @file src/breaker/from-sync.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { defaults, BreakerOptionsGiven, BreakerStateObject } from './types'
import { SyncFunction } from '../types'
import { MemoryStore } from '../store'

export function fromSync<T = any>(
	originalFn: SyncFunction<T>,
	_options?: BreakerOptionsGiven,
): SyncFunction<T> {
	const options = defaults(_options)
	const state: BreakerStateObject = {
		numErrors: 0,
		lastError: 'Unknown error',
		lastErrorTime: 0,
	}

	// sync breakers cannot be distributed
	if (!(options.store instanceof MemoryStore)) {
		throw new Error(
			`Synchronous breakers cannot be distributed. Use an async breaker.`,
		)
	}

	return function syncBreaker(this: any, ...args: any[]): T {
		if (
			state.numErrors >= options.maxErrors &&
			Date.now() - state.lastErrorTime < options.timeout
		) {
			throw new Error(state.lastError)
		}

		try {
			const result = originalFn.apply(this, args)
			state.numErrors = 0
			state.lastErrorTime = 0
			return result
		} catch (err) {
			++state.numErrors
			state.lastError = String(err.message || err).split('\n')[0]
			state.lastErrorTime = Date.now()
			throw new Error(state.lastError)
		}
	}
}
