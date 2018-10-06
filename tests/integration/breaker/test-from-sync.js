/**
 * @file tests/breaker/test-from-sync.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'
import lolex from 'lolex'

import { Breaker } from '../../../'

test('Breaker.fromSync()', t => {
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

  // to start, should not throw error
  t.is(breakerFn(), Math.PI)
  t.is(nCalls, 1)

  // throw real error now
  shouldThrowError = true
  t.is(t.throws(breakerFn).message, 'Failure!')
  t.is(nCalls, 2)

  // should still throw error now that breaker is tripped
  shouldThrowError = false
  t.is(t.throws(breakerFn).message, 'Failure!')
  // still only called twice, breaker has been tripped
  t.is(nCalls, 2)

  // should call function again after timeout (half-open)
  clock.tick(TIMEOUT + 1)
  shouldThrowError = true
  t.is(t.throws(breakerFn).message, 'Failure!')
  t.is(nCalls, 3, 'should have run a third time')

  // breaker should be tripped again
  shouldThrowError = false
  t.is(t.throws(breakerFn).message, 'Failure!')
  t.is(nCalls, 3)

  // breaker should be half-open again
  clock.tick(TIMEOUT)
  t.is(breakerFn(), Math.PI)
  t.is(nCalls, 4)

  // breaker should be open again
  t.is(breakerFn(), Math.PI)
  t.is(nCalls, 5)

  // cleanup
  clock.uninstall()
})
