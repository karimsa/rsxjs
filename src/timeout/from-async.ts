/**
 * @file src/timeout/from-async.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import * as Errors from '../errors'
import { AsyncFunction } from '../types'
import { defaults, TimeoutOptionsGiven } from './types'

export function fromAsync<T>(
  cb: AsyncFunction<T>,
  _options?: TimeoutOptionsGiven
): AsyncFunction<T> {
  const options = defaults(_options)

  return function asyncTimeout(...args: any[]): Promise<T> {
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
