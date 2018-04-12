/**
 * @file tests/timeout/from-async.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const test = require('ava')
const { spy } = require('sinon')
const { delay } = require('bluebird')

const { Timeout } = require('../../')

test('Timeout.fromAsync()', async t => {
  const timeout = 1000

  // create operation from never resolving promise
  const spyFn = spy(() => new Promise(() => {}))
  const slowOp = Timeout.fromAsync(spyFn, { timeout })

  await t.throws(slowOp(1, 2, 3))
  t.true(spyFn.called, 'underlying operation should have run')
  t.true(spyFn.calledWithExactly(1, 2, 3), 'arguments should be passed through')
})
