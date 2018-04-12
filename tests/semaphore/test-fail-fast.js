/**
 * @file tests/semaphore/test-fail-fast.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const test = require('ava')

const { Semaphore } = require('../../')

test('fromAsync()#failFast', async t => {
  const SIZE = 2
  const work = Semaphore.fromAsync(() => new Promise(() => {}), {
    size: SIZE,
    failFast: true,
  })

  work()
  work()

  await t.throws(work())
})
