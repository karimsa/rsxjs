/**
 * @file tests/channel/test-close.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const { test } = require('ava')

const { makeChan } = require('../../')

test('should not be able to read/write on a closed channel', async t => {
  const c = makeChan()
  c.close()

  t.is(String(await t.throws(c.put(0))), 'Error: Cannot operate on a closed channel')
  t.is(String(await t.throws(c.take())), 'Error: Cannot operate on a closed channel')
})

test('should be able to read off a closed channel with an unflushed buffer', async t => {
  const c = makeChan({ bufferSize: 2 })
  await c.put('a')
  await c.put('b')
  c.close()

  t.is(await c.take(), 'a')
  t.is(await c.take(), 'b')

  t.is(String(await t.throws(c.put(0))), 'Error: Cannot operate on a closed channel')
  t.is(String(await t.throws(c.take())), 'Error: Cannot operate on a closed channel')
})
