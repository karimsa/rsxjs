/**
 * @file tests/mutex/test-mutex.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'
import { delay } from 'bluebird'

import { Mutex } from '../../../'

const DELAY = 100

function createTest(method, fn) {
  return async t => {
    const LEN = 30

    const frames = []
    const lockedFn = Mutex[method](fn)

    // concurrently start 30 of these, should
    // take 3s to run and all frames should be
    // 100ms+ apart
    const start = Date.now()
    await Promise.all(
      [...new Array(LEN).keys()].map(() => lockedFn(frames))
    )
    const end = Date.now()

    t.true(end - start >= 3e3, 'should take at least 3s to run')
    t.is(frames.length, LEN, `should have ${LEN} frames`)

    for (let i = 1; i < frames.length; ++i) {
      t.true(frames[i] - frames[i - 1] >= DELAY, `should have at least ${DELAY}ms between frames`)
    }
  }
}

test('Mutex#fromAsync', createTest('fromAsync', async function(frames) {
  await delay(DELAY + 1)
  frames.push(Date.now())
}))

test('Mutex#fromGenerator', createTest('fromGenerator', function*(frames) {
  yield delay(DELAY + 1)
  frames.push(Date.now())
}))

test('Mutex#lock', async t => {
  const LEN = 30

  const frames = []
  async function lockedFn() {
    const m = await Mutex.lock({ name: 'test' })
    await delay(DELAY + 1)
    frames.push(Date.now())
    await m.unlock()
  }

  // concurrently start 30 of these, should
  // take 3s to run and all frames should be
  // 100ms+ apart
  const start = Date.now()
  await Promise.all(
    [...new Array(LEN).keys()].map(() => lockedFn(frames))
  )
  const end = Date.now()

  t.true(end - start >= 3e3, 'should take at least 3s to run')
  t.is(frames.length, LEN, `should have ${LEN} frames`)

  for (let i = 1; i < frames.length; ++i) {
    t.true(frames[i] - frames[i - 1] >= DELAY, `should have at least ${DELAY}ms between frames`)
  }
})
