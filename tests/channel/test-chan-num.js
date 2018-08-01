/**
 * @file tests/channel/test-chan-num.js
 * @description Testing behavior of a simple number channel in buffered & unbuffered modes.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from 'ava'

import { makeChan } from '../../'

test('put with no take', async t => {
  const c = makeChan()
  const r = Math.random()
  t.deepEqual(await c.put(r, 100), { ok: false })
})

test('chan: unbuffered number', async t => {
  const c = makeChan()
  const r = Math.random()
  const p = c.take()
  t.deepEqual(await c.put(r), { ok: true })
  t.deepEqual(await p, { ok: true, value: r })
})

test('chan: buffered number', async t => {
  const c = makeChan({
    bufferSize: 1,
  })
  const r = Math.random()

  t.deepEqual(await c.put(r), { ok: true })
  t.deepEqual(await c.take(), { ok: true, value: r })
})

test('chan: buffered then unbuffered', async t => {
  const c = makeChan({
    bufferSize: 1,
  })
  const r1 = Math.random()
  const r2 = Math.random()
  
  t.deepEqual(await c.put(r1), { ok: true })
  t.deepEqual(await c.put(r2, 10), { ok: false })

  t.deepEqual(await c.take(), { ok: true, value: r1 })
  t.deepEqual(await c.take(), { ok: true, value: r2 })
  t.deepEqual(await c.take(10), { ok: false })
})
