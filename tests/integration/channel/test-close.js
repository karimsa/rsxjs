/**
 * @file tests/channel/test-close.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from 'ava'

import { makeChan } from '../../../'

test('should not be able to read/write on a closed channel', async t => {
  const c = makeChan()
  c.close()

  t.deepEqual(await c.put(0), { ok: false })
  t.deepEqual(await c.take(), { ok: false })
})

test('should be able to read off a closed channel with an unflushed buffer', async t => {
  const c = makeChan({ bufferSize: 2 })
  t.deepEqual(await c.put('a'), { ok: true })
  t.deepEqual(await c.put('b'), { ok: true })
  c.close()

  t.deepEqual(await c.take(), { ok: true, value: 'a' })
  t.deepEqual(await c.take(), { ok: true, value: 'b' })

  t.deepEqual(await c.put(0), { ok: false })
  t.deepEqual(await c.take(), { ok: false })
})
