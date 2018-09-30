/**
 * @file tests/deferral/test-from-async.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from 'ava'
import { spy } from 'sinon'

import { Deferral } from '../../../'

test('on success', async t => {
  const fn = spy(() => {})
  const op = Deferral.fromAsync(async function ( defer ) {
    defer(fn)
    await 1
    await 2
  })

  t.is(await op(), undefined)
  t.true(fn.calledOnce)
})

test('on success with generator', async t => {
  const fn = spy(() => {})
  const op = Deferral.fromGenerator(function*( defer ) {
    defer(fn)
    yield 1
    yield 2
  })

  t.is(await op(), undefined)
  t.true(fn.calledOnce)
})
