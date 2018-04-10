/**
 * @file src/timeout/from-async.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import * as Errors from '../errors'
import { AsyncFunction } from '../types'
import { defaults, TimeoutOptionsGiven } from './types'

/**
 * Enforce a timeout over an async function.
 * @param {AsyncFunction<T>} cb async function to enforce timeout over
 * @param {TimeoutOptions} _options timeout options
 * @returns {AsyncFunction<T>} an async function with identical behavior, but will timeout
 */
export function fromAsync<T>(
  cb: AsyncFunction<T>,
  _options?: TimeoutOptionsGiven
): AsyncFunction<T> {
  const options = defaults(_options)

  return function asyncTimeout(this: any, ...args: any[]): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(Errors.TIMEOUT))
      }, options.timeout)

      const retval = await cb.apply(this, args)
      clearTimeout(timeout)
      resolve(retval)
    })
  }
}

/**
 * Factory for timeouts to allow currying of timeout creation.
 * @param {TimeoutOptionsGiven} options set of options to use when creating the timeout
 */
export function factory<T>(options: TimeoutOptionsGiven) {
  return function fromFactory(fn: AsyncFunction<T>) {
    return fromAsync(fn, options)
  }
}
