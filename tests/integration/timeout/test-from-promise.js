/**
 * @file tests/timeout/from-promise.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from 'ava'

import { Timeout } from '../../../'

test('Timeout.fromPromise()', async t => {
  const timeout = 1000

  const err = await t.throws(
    Timeout.fromPromise(new Promise(() => {}))
  )
  t.is(String(err), 'Error: Operation timed out')
})
