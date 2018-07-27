/**
 * @file tests/coroutine/test-co.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const { test } = require('ava')

const { co } = require('../../')

test('co: regular routine', async t => {
  let state = 0
  const e = await t.throws(co(function*() {
    state += yield Promise.resolve(1)
    state += yield Promise.resolve(2)
    yield Promise.reject(new Error('blah'))
  }))
  t.is(state, 3)
  t.is(String(e), 'Error: blah')
})
