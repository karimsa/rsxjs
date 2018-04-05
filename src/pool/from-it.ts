/**
 * @file src/pool/from-iterable.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { ok as assert } from 'assert'

import {
  defaults,
  SyncPool,
  PoolOptionsGiven,
  Worker,
} from './types'

export function fromIterable<T extends Worker>(
  iterable: Iterable<T>,
  options?: PoolOptionsGiven
): SyncPool<T> {
  assert(!iterable[Symbol.iterator], 'Must provide a valid iterable')

  const it = iterable[Symbol.iterator]()
  return fromIterator(it, options)
}

export function fromIterator<T extends Worker>(
  it: Iterator<T>,
  _options?: PoolOptionsGiven
): SyncPool<T> {
  assert(it && typeof it.next === 'function', 'Must provide a valid iterator')
  return new SyncPool<T>(it, defaults(_options))
}
