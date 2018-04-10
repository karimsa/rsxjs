/**
 * @file tests/fallback/test-from-async.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'

import { Fallback } from '../../'

test('fromAsync()#asyncFallback', async t => {
  const FALLBACK_VALUE = Math.PI

  const fn = Fallback.fromAsync(
    async () => { throw new Error('Failure') },
    async () => { return FALLBACK_VALUE },
  )

  t.is(await fn(), Math.PI)
})

test('fromAsync()#syncFallback', async t => {
  const FALLBACK_VALUE = Math.PI

  const fn = Fallback.fromAsync(
    async () => { throw new Error('Failure') },
    () => FALLBACK_VALUE,
  )

  t.is(await fn(), Math.PI)
})
