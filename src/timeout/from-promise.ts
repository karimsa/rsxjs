/**
 * @file src/timeout/from-promise.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import * as Errors from '../errors'
import { defaults, TimeoutOptionsGiven } from './types'

/**
 * Enforce a timeout over an async function.
 * @param {AsyncFunction<T>} cb async function to enforce timeout over
 * @param {TimeoutOptions} _options timeout options
 * @returns {AsyncFunction<T>} an async function with identical behavior, but will timeout
 */
export function fromPromise<T>(
	promise: Promise<T>,
	_options?: TimeoutOptionsGiven,
): Promise<T> {
	const options = defaults(_options)

	return new Promise(async (resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error(Errors.TIMEOUT))
		}, options.timeout)

		try {
			const v = await promise
			clearTimeout(timeout)
			resolve(v)
		} catch (err) {
			clearTimeout(timeout)
			reject(err)
		}
	})
}
