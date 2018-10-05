/**
 * @file tests/integration/cache/test-concurrent.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const test = require('ava')
const { spy } = require('sinon')

const { Cache, WaitGroup, delay, co } = require('../../../')

function underlyingOperation() {
  ++this.callCount
  return Promise.resolve({ random: Math.random() })
}

const verifyResult = co.wrap(function*(_, t, fn, targetResult) {
  const result = yield fn()
  yield delay(100)
  t.true(result === targetResult, 'Function should return same address')
})

function createResults(t, fn, targetResult) {
  const wg = new WaitGroup()
  for (let i = 0; i < 5; ++i) {
    wg.add(verifyResult(t, fn, targetResult))
  }
  return wg.wait()
}

test('invalidation by gbc', t => co(function* () {
  const state = { callCount: 0 }
  const expensiveOperation = Cache.fromAsync(underlyingOperation.bind(state), {
    type: 'concurrent',

    // do not allow force sweep during the test
    expiry: 60 * 1000,
  })

  yield createResults(t, expensiveOperation, yield expensiveOperation())
  t.is(state.callCount, 1, 'Operation should only ever be called once')

  // force sweep, since no concurrent calls are being made, no one should have
  // a strong reference to the result
  global.gc()

  // now new calls should be made
  const newResult = yield expensiveOperation()
  t.is(state.callCount, 2, 'Operation should be re-called after sweep')
}))
