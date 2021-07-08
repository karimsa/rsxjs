/**
 * @file src/timeout/from-async.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { AsyncFunction } from '../types'
import { TimeoutOptionsGiven } from './types'
import { fromPromise } from './from-promise'

/**
 * Enforce a timeout over an existing promise.
 * @param {Promise<T>} promise promise to enforce timeout over
 * @param {TimeoutOptions} _options timeout options
 * @returns {Promises<T>} resolves with the promise's value, or rejects with a timeout
 */
export function fromAsync<T>(
	cb: AsyncFunction<T>,
	options?: TimeoutOptionsGiven,
): AsyncFunction<T> {
	return function asyncTimeout(this: any, ...args: any[]): Promise<T> {
		return fromPromise(cb.apply(this, args), options)
	}
}

/**
 * Factory for timeouts to allow currying of timeout creation.
 * @param {TimeoutOptionsGiven} options set of options to use when creating the timeout
 */
export function factory<T>(options: TimeoutOptionsGiven) {
	return function fromFactory(fn: AsyncFunction<T>) {
		return fromAsync(fn, options)
	}
}
