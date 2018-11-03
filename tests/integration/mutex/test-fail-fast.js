/**
 * @file tests/mutex/test-fail-fast.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'

import { Mutex } from '../../../'

test('Mutex#failFast', async t => {
  const fn = Mutex.fromAsync(() => new Promise(() => {
    // hang
  }), {
    failFast: true,
  })

  // this will cause a locked state, and since
  // the method will not end, lock will not be released
  fn()

  // should fail instead of waiting
  await t.throwsAsync(fn())
})
