/**
 * @file tests/coroutine/test-cancel.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'

import { co } from '../../../'

test('co: cancel while running', async t => {
  let state = 0
  const e = co(function*() {
    state += 1
    state += yield Promise.resolve(1)
    state += yield Promise.resolve(2)
    yield Promise.reject(new Error('blah'))
  })
  
  t.is(await e.cancel(), false)
  t.is(await e, undefined)
  t.is(state, 1)
})
