/**
 * @file tests/integration/cache/test-concurrent.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'
import { spy } from 'sinon'

import { Cache } from '../../../'

test('Cache.fromAsync({ type: \'concurrent\' })', async t => {
  const underlyingOperation = spy(() => Promise.resolve({ random: Math.random() }))
  const expensiveOperation = Cache.fromAsync(underlyingOperation, { type: 'concurrent' })
  const expensiveResult = await expensiveOperation()

  const results = await Promise.all([...Array(10).keys()].map(() => expensiveOperation()))
  const { callCount } = underlyingOperation
  t.is(callCount, 1, 'Operation should only ever be called once')

  for (const result of results) {
    t.true(expensiveResult === result, 'All operations should access the same object')
  }
})
