/**
 * @file src/mutex/index.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { v4 as uuid } from 'uuid'

import * as Errors from '../errors'
import { delay } from '../utils'
import { MutexOptions } from './types'
import { MemoryStore, Store } from '../store'
import { Lock, ReleaseLock } from '../types'

const TIME_BETWEEN_SPINS = 10

export class Mutex extends Lock {
  private readonly name: string
  private readonly failFast: boolean
  private readonly store: Store

  constructor(options: Partial<MutexOptions> = {}) {
    super()

    this.name = options.name || uuid()
    this.failFast = options.failFast === true
    this.store = options.store || new MemoryStore()
  }

  /**
   * Lock the mutex.
   * @returns {Promise<ReleaseLock>} resolves when mutex is available with a function that can release the mutex
   */
  async lock(): Promise<ReleaseLock> {
    this.ref()
    const lockId = uuid()

    if (await this.store.setnx(this.name, lockId)) {
      return () =>
        this.store.del(this.name)
          .then(() => this.unref())
    }

    if (this.failFast) {
      throw new Error(Errors.COULD_NOT_LOCK)
    }

    return delay(TIME_BETWEEN_SPINS).then(() => this.lock())
  }
}
