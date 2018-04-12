/**
 * @file tests/mutex/test-fail-fast.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const test = require('ava')
const { delay } = require('bluebird')

const { Mutex } = require('../../')

test('Mutex#failFast', async t => {
  const fn = Mutex.fromAsync(() => new Promise(() => {
    // hang
  }), {
    failFast: true,
  })

  // this will cause a locked state, and since
  // the method will not end, lock will not be released
  fn()

  // should fail instead of waiting
  await t.throws(fn())
})
