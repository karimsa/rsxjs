/**
 * @file tests/semaphore/test-fail-fast.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'
import { delay } from 'bluebird'

import { Semaphore } from '../../'

test('Semaphore#failFast', async t => {
  const SIZE = 5
  const s = new Semaphore(SIZE)
  t.plan(SIZE + 1)

  // gain SIZE locks
  for (let i = 0; i < SIZE; ++i) {
    await s.lock()

    if (SIZE - 1 === i) t.true(s.isLocked())
    else t.false(s.isLocked())
  }

  await t.throws(s.lock(true))
})
