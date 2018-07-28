/**
 * @file tests/channel/test-range.js
 * @description Testing behavior of ranging over channel.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const { test } = require('ava')

const { makeChan } = require('../../')

test('range over channel', async t => {
  const c = makeChan({
    bufferSize: 4,
  }) 

  await c.put(1)
  await c.put(2)
  c.close()

  let i = 0
  for await (const value of c) {
    t.is(value, ++i)
  }
})
