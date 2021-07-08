/**
 * @file src/fallback/from-async.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { FallbackResult } from './types'
import { AsyncFunction, SyncFunction } from '../types'

export function fromAsync<T>(
	fn: AsyncFunction<T>,
	fallback: AsyncFunction<T> | SyncFunction<T>,
): AsyncFunction<T> {
	return async function fallbackFn(this: any, ...args: any[]): Promise<T> {
		try {
			const ret = await fn.apply(this, args)
			return ret
		} catch (err) {
			const ret = await (fallback as any).apply(this, args)

			if (typeof ret === 'object') {
				return Object.assign(
					{
						isFallback: true,
						error: err,
					} as FallbackResult,
					ret,
				)
			}

			return ret
		}
	}
}
