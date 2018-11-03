/**
 * @file tests/coroutine/test-co.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'

import { co } from '../../../'

test('co: regular routine', async t => {
  let state = 0
  const e = await t.throwsAsync(co(function*() {
    state += yield Promise.resolve(1)
    state += yield Promise.resolve(2)
    yield Promise.reject(new Error('blah'))
  }))
  t.is(state, 3)
  t.is(String(e), 'Error: blah')
})
