/**
 * @file tests/waitgroup/test-promise-waitgroup.js
 * @description Testing waitgroups with pushing promises onto the group.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'

import { WaitGroup } from '../../../'

const SIZE = 10
const DELAY = 100

test('waitgroup: with promises', async t => {
  const wg = new WaitGroup()
  
  const start = Date.now()
  for (let i = 0; i < SIZE; ++i) {
    wg.add(new Promise(r => setTimeout(r, DELAY)))
  }
  await wg.wait()
  
  const dur = Date.now() - start
  t.true(dur >= DELAY, `Took ${dur}ms, should've taken more than ${DELAY}ms`)
})
