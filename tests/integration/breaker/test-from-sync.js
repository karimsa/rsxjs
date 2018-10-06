/**
 * @file tests/breaker/test-from-sync.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'
import lolex from 'lolex'
import { format, inspect } from 'util'

import { Breaker } from '../../../'

test('Breaker.fromSync()', async t => {
  const MAX_ERRORS = 1 // trip after one error
  const TIMEOUT = 500 // wait for 500 seconds in between states

  let shouldThrowError = false
  let nCalls = 0

  const breakerFn = Breaker.fromSync(() => {
    ++nCalls

    if (shouldThrowError) {
      throw new Error('Failure!')
    }

    return Math.PI
  }, {
    maxErrors: MAX_ERRORS,
    timeout: TIMEOUT,
  })

  const clock = lolex.install({
    target: global,
    toFake: ['Date'],
  })

  t.is(await breakerFn(), Math.PI, 'On first call, should not throw error')
  t.is(nCalls, 1, 'One call should be done')

  shouldThrowError = true
  t.is((await t.throws(breakerFn())).message, 'Failure!', 'Error should be thrown correctly')
  t.is(nCalls, 2, 'A second call should have been made')

  shouldThrowError = false
  t.is((await t.throws(breakerFn())).message, 'Failure!', 'Should still throw error after breaker is tripped')
  t.is(nCalls, 2, 'A third call should not be made in a tripped state')

  clock.tick(TIMEOUT + 1)
  shouldThrowError = true
  t.is((await t.throws(breakerFn())).message, 'Failure!', 'Should proxy forward error from underlying resource in half-open state')
  t.is(nCalls, 3, 'A third call should be made in half-open state')

  shouldThrowError = false
  t.is((await t.throws(breakerFn())).message, 'Failure!', 'Should re-forward error in closed state')
  t.is(nCalls, 3, 'Breaker should have tripped again')

  clock.tick(TIMEOUT)
  t.is(await breakerFn(), Math.PI, 'Breaker should be half-open again and should proxy result')
  t.is(nCalls, 4, 'Underlying resource should be re-used in half-open state')

  t.is(await breakerFn(), Math.PI, 'Breaker should once again be open after successful half-open')
  t.is(nCalls, 5, 'Resource should be re-used after half-open state')

  // cleanup
  clock.uninstall()
})
