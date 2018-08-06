/**
 * @file tests/utils/test-debounce.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from 'ava'
import { spy } from 'sinon'

import { debounce, delay } from '../../../'

test('debounce', async t => {
  const _fn = spy(() => {})
  const fn = debounce(_fn, 100)
  const called = n => t.is(_fn.callCount, n)

  // all 10 calls should be ignored
  for (let i = 0; i < 10; ++i) fn()
  called(0)

  // wait for debounce delay plus a bit, since
  // timeouts are not exact
  await delay(150)
  called(1)
})
