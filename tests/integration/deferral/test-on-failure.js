/**
 * @file tests/deferral/test-on-failure.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from 'ava'
import { spy } from 'sinon'

import { Deferral } from '../../../'

test('on failure', async t => {
  const fn = spy(() => {})
  const op = Deferral.fromAsync(async function ( defer ) {
    defer(fn)
    throw new Error('Failure')
  })

  const e = await t.throws(op())
  t.is(String(e), 'Error: Failure')
  t.true(fn.calledOnce)
})

test('on failure with generator', async t => {
  const fn = spy(() => {})
  const op = Deferral.fromGenerator(function* ( defer ) {
    defer(fn)
    throw new Error('Failure')
  })

  const e = await t.throws(op())
  t.is(String(e), 'Error: Failure')
  t.true(fn.calledOnce)
})
