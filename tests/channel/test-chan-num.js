/**
 * @file tests/channel/test-chan-num.js
 * @description Testing behavior of a simple number channel in buffered & unbuffered modes.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const { makeChan } = require('../../')
const { test } = require('ava')

test('put then take', async t => {
  const c = makeChan()
  const r = Math.random()

  // timeout, no one is waiting
  const e = await t.throws(c.put(r, 100))
  t.is(String(e), 'Error: Operation timed out')
})

test('chan: unbuffered number', async t => {
  const c = makeChan()
  const r = Math.random()
  const p = c.take()
  await c.put(r)
  t.is(await p, r)
})

test('chan: buffered number', async t => {
  const c = makeChan({
    bufferSize: 1,
  })
  const r = Math.random()
  
  await c.put(r)
  t.is(await c.take(), r)
})

test('chan: buffered then unbuffered', async t => {
  const c = makeChan({
    bufferSize: 1,
  })
  const r1 = Math.random()
  const r2 = Math.random()
  
  await c.put(r1)
  const err = await t.throws(c.put(r2, 10))
  t.is(String(err), 'Error: Operation timed out')
  
  t.is(await c.take(), r1)
  t.is(await c.take(), r2)
  
  const takeErr = await t.throws(c.take(10))
  t.is(String(takeErr), 'Error: Operation timed out')
})
