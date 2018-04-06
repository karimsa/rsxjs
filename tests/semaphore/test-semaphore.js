/**
 * @file tests/semaphore/test-semaphore.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'
import { delay } from 'bluebird'

import { Semaphore } from '../../'

test('new Semaphore()', async t => {
  const SIZE = 5
  const s = new Semaphore(SIZE)
  t.plan(SIZE)

  // gain SIZE locks
  for (let i = 0; i < SIZE; ++i) {
    await s.lock()

    if (SIZE - 1 === i) t.true(s.isLocked())
    else t.false(s.isLocked())
  }
})
