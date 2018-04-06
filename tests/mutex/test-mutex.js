/**
 * @file tests/mutex/test-mutex.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'
import { delay } from 'bluebird'

import { Mutex } from '../../'

test('new Mutex()', async t => {
  const m = new Mutex()
  const LEN = 30
  const DELAY = 100

  const frames = []
  async function lockedFn() {
    const unlock = await m.lock()
    t.is(m.isLocked(), true)
    await delay(DELAY + 1)
    frames.push(Date.now())
    unlock()
    t.throws(unlock)
  }

  // concurrently start 30 of these, should
  // take 3s to run and all frames should be
  // 100ms+ apart
  const start = Date.now()
  await Promise.all(
    [...new Array(LEN).keys()].map(lockedFn)
  )
  const end = Date.now()
  t.is(m.isLocked(), false)

  t.true(end - start >= 3e3, 'should take at least 3s to run')
  t.is(frames.length, LEN, `should have ${LEN} frames`)

  for (let i = 1; i < frames.length; ++i) {
    t.true(frames[i] - frames[i - 1] >= DELAY, `should have at least ${DELAY}ms between frames`)
  }
})
