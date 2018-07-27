/**
 * @file tests/waitgroup/test-ints-waitgroup.js
 * @description Testing raw behavior of WaitGroup with simple integer pushing.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const { test } = require('ava')
const { WaitGroup } = require('../../')

const SIZE = 10
const DELAY = 100

test('waitgroup: with ints', async t => {
  const wg = new WaitGroup()
  
  const start = Date.now()
  for (let i = 0; i < SIZE; ++i) {
    wg.add(1)
    setTimeout(() => wg.done(), DELAY)
  }
  await wg.wait()
  
  const dur = Date.now() - start
  t.true(dur >= DELAY, `Took ${dur}ms, should've taken more than ${DELAY}ms`)
})
