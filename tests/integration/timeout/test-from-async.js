/**
 * @file tests/timeout/from-async.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'
import { spy } from 'sinon'

import { Timeout } from '../../../'

test('Timeout.fromAsync()', async t => {
  const timeout = 1000

  // create operation from never resolving promise
  const spyFn = spy(() => new Promise(() => {}))
  const slowOp = Timeout.fromAsync(spyFn, { timeout })

  const err = await t.throws(slowOp(1, 2, 3))
  t.true(spyFn.called, 'underlying operation should have run')
  t.true(spyFn.calledWithExactly(1, 2, 3), 'arguments should be passed through')
  t.is(String(err), 'Error: Operation timed out')
})
