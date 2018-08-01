/**
 * @file tests/timeout/test-after.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from 'ava'

import { Timeout } from '../../'

test('Timeout.after()', async t => {
  const timeout = 500
  const start = Date.now()
  const chan = Timeout.after(timeout)
  await chan.take()
  t.true(Date.now() - start >= timeout)
})
