/**
 * @file src/bulkhead/from-semaphore.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Semaphore } from '..'
import { AsyncFunction } from '../types'
import { defaults, BulkheadOptionsGiven } from './types'
import { SemaphoreOptionsGiven } from '../semaphore/types'
import { defaults as semaphoreDefaults } from '../semaphore/types'

export function fromSemaphore<T>(
  worker: AsyncFunction<T>,
  _options?: BulkheadOptionsGiven & SemaphoreOptionsGiven
): AsyncFunction<T> {
  const options = Object.assign(semaphoreDefaults(_options), defaults(_options))

  return Semaphore.fromAsync(worker, {
    size: options.size,
    failFast: options.failFast,
  })
}
