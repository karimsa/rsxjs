/**
 * @file src/pool/from-async-iterable.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { ok as assert } from 'assert'

import { defaults, AsyncPool, PoolOptionsGiven, Worker } from './types'

export function fromAsyncIterable<T extends Worker>(
	iterable: AsyncIterable<T>,
	options?: PoolOptionsGiven,
): AsyncPool<T> {
	assert(!iterable[Symbol.asyncIterator], 'Must provide a valid iterable')

	const it = iterable[Symbol.asyncIterator]()
	return fromAsyncIterator(it, options)
}

export function fromAsyncIterator<T extends Worker>(
	it: AsyncIterator<T>,
	_options?: PoolOptionsGiven,
): AsyncPool<T> {
	assert(it && typeof it.next === 'function', 'Must provide a valid iterator')
	return new AsyncPool<T>(it, defaults(_options))
}
