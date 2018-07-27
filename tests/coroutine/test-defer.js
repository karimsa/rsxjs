/**
 * @file tests/coroutine/test-defer.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const { test } = require('ava')
const { spy } = require('sinon')

const { co } = require('../../')

test('co: routine + defer', async t => {
  const fn = spy(() => {})
  const e = await t.throws(co(function*(d) {
    d(fn)
    yield Promise.reject(new Error('blah'))
  }))

  t.is(String(e), 'Error: blah')
  t.true(fn.calledOnce)
})
