/**
 * @file tests/waitgroup/test-promise-waitgroup.js
 * @description Testing waitgroups with pushing promises onto the group.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const { test } = require('ava')
const { WaitGroup } = require('../../')

const SIZE = 10
const DELAY = 100

test('waitgroup: with recursive promises', async t => {
  const wg = new WaitGroup()
  
  const start = Date.now()
  for (let i = 0; i < SIZE; ++i) {
    wg.add(new Promise(r => setTimeout(() => {
      r()
      wg.add(new Promise(rr => {
        setTimeout(rr, DELAY)
      }))
    }, DELAY)))
  }
  await wg.wait()
  
  const dur = Date.now() - start
  t.true(dur >= DELAY, `Took ${dur}ms, should've taken more than ${DELAY}ms`)
})
