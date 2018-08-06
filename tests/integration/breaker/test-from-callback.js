/**
 * @file tests/breaker/test-from-sync.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'
import lolex from 'lolex'
import { spy } from 'sinon'
import { readFile, readFileSync } from 'fs'
import { resolve as resolvePath } from 'path'

import { Breaker } from '../../../'

test('Breaker.fromCallback()', async t => {
  const MAX_ERRORS = 1 // trip after one error
  const TIMEOUT = 500 // wait for 500 seconds in between states

  let shouldThrowError = false

  const readFileSpy = spy(readFile)
  const _breakerFn = Breaker.fromCallback(readFileSpy, {
    maxErrors: MAX_ERRORS,
    timeout: TIMEOUT,
  })

  // just for testing easier
  const EXPECTED_DATA = readFileSync(__filename, 'utf8')
  const breakerFn = () => new Promise((resolve, reject) => {
    _breakerFn(
      shouldThrowError ? 
      resolvePath(__dirname, String(Math.random())) :
      __filename
    , 'utf8', (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })

  const clock = lolex.install({
    target: global,
    toFake: ['Date'],
  })

  // to start, should not throw error
  t.is(await breakerFn(), EXPECTED_DATA)
  t.is(readFileSpy.callCount, 1)

  // throw real error now
  shouldThrowError = true
  await t.throws( breakerFn() )
  t.is(readFileSpy.callCount, 2)

  // should still throw error now that breaker is tripped
  shouldThrowError = false
  await t.throws( breakerFn() )
  // still only called twice, breaker has been tripped
  t.is(readFileSpy.callCount, 2)

  // should call function again after timeout (half-open)
  clock.tick(TIMEOUT + 1)
  shouldThrowError = true
  await t.throws( breakerFn() )
  t.is(readFileSpy.callCount, 3, 'should have run a third time')

  // breaker should be tripped again
  shouldThrowError = false
  await t.throws( breakerFn() )
  t.is(readFileSpy.callCount, 3)

  // breaker should be half-open again
  clock.tick(TIMEOUT)
  t.is(await breakerFn(), EXPECTED_DATA)
  t.is(readFileSpy.callCount, 4)

  // breaker should be open again
  t.is(await breakerFn(), EXPECTED_DATA)
  t.is(readFileSpy.callCount, 5)

  // cleanup
  clock.uninstall()
})
