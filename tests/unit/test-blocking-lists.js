/**
 * @file tests/unit/test-blocking-lists.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from 'ava'
import { v4 as uuid } from 'uuid'

import { MemoryStore, delay } from '../../dist'

function createTest(ds, upushDir, upopDir, expected, wait = 0, only = false) {
  const pushDir = upushDir.toLowerCase()
  const popDir = upopDir.toLowerCase()
  const testFn = only ? test.only : test

  testFn(`should be able to block as a ${ds} (${upushDir}T${upopDir})`, async t => {
    const store = new MemoryStore()
    const listName = `testList:${uuid()}`

    const received = []
    let shouldRun = true
    const p = new Promise(async resolve => {
      await delay(wait)

      while (shouldRun) {
        const elm = await store[`b${popDir}pop`](listName, 5)
        if (elm) {
          received.push(elm)
        }
      }
  
      resolve()
    })
  
    // starts off empty
    await 1
    t.is(received.length, 0, 'Should start as an empty list')
  
    // push some stuff in
    await store[`${pushDir}push`](listName, 'a')
    await store[`${pushDir}push`](listName, 'b')
    await store[`${pushDir}push`](listName, 'c')
    await store[`${pushDir}push`](listName, 'd')
  
    // should show up in FIFO order
    while (received.length < 4) {
      await delay(5)
    }
    t.deepEqual(received, expected, `Should operate as a ${ds}`)

    // cleanup
    shouldRun = false
    await p
  })
}

// with the consumer consuming as fast as the publisher publishes,
// it will always feel like a queue - stacks will jus\

createTest('queue', 'L', 'R', ['a', 'b', 'c', 'd'])
createTest('queue', 'R', 'L', ['a', 'b', 'c', 'd'])

// slowing it down shows the real effects of direction
createTest('queue (slow)', 'L', 'R', ['a', 'b', 'c', 'd'], 1000)
createTest('queue (slow)', 'R', 'L', ['a', 'b', 'c', 'd'], 1000)
createTest('stack (slow)', 'L', 'L', ['d', 'c', 'b', 'a'], 1000)
createTest('stack (slow)', 'R', 'R', ['d', 'c', 'b', 'a'], 1000)
