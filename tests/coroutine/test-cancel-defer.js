/**
 * @file tests/coroutine/test-cancel-defer.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const { test } = require('ava')
const { spy } = require('sinon')

const { co } = require('../../')

test('co: cancel + defer', async t => {
  const fn = spy(() => {})
  const e = co(function*(d) {
    d(fn)

    yield 1
    yield Promise.reject(new Error('blah'))
  })

  t.is(await e.cancel(), false)
  t.is(await e, undefined)
  t.true(fn.calledOnce)
})
