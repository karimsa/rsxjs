/**
 * @file tests/mutex/test-fail-fast.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'
import { delay } from 'bluebird'

import { Mutex } from '../../'

test('Mutex#failFast', async t => {
  const m = new Mutex()
  const unlock = await m.lock()
  await t.throws(m.lock(true))
  unlock()
})
