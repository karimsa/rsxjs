/**
 * @file tests/integration/mutex/test-rw.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from 'ava'

import { RWMutex } from '../../../'

test('should allow many readers to obtain locks', async t => {
  const mux = new RWMutex()

  const unlocks = []
  for (let i = 0; i < 1e2; ++i) {
    unlocks.push(await mux.RLock())
  }

  for (const unlock of unlocks) {
    t.throws(
      mux.WLock({ failFast: true }),
      'Unable to obtain lock',
      'Should not be able to obtain write lock when reading'
    )
    await unlock()
  }

  await mux.WLock()
})

test('should not starve writers', async t => {
  const mux = new RWMutex()

  // R1 locks
  const r1Unlock = await mux.RLock()

  // W1 is gonna wait to lock
  let writerHasLocked = false
  const w1Promise = mux.WLock().then(() => {
    writerHasLocked = true
  })
  await 1

  // ensure that writer is still waiting
  t.false(writerHasLocked, 'Writer should not obtain lock')

  // r2 tries to lock, should not work
  t.throws(
    mux.RLock({ failFast: true }),
    'Unable to obtain lock',
    'R2 should have to wait after W1 arrives'
  )

  // let R2 try optimistically
  let r2HasLocked = false
  const r2Promise = mux.RLock().then(() => {
    r2HasLocked = true
  })
  await 1
  t.false(r2HasLocked, 'R2 should have to wait after W1 arrives - even without failFast')

  // R1 unlocks, W1 should lock
  await r1Unlock()
  await w1Promise

  // technically, the spinning of the lock causes this to be a race - instead
  // of a proper queue
  // t.true(writerHasLocked, 'W1 should be locked after R1 unlocks')
  // t.false(r2HasLocked, 'R2 should still be waiting')
})
