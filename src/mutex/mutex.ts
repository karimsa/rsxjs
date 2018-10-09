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
  private readonly timeout?: number
  private readonly store: Store

  constructor(options: Partial<MutexOptions> = {}) {
    super()

    this.name = options.name || uuid()
    this.timeout = options.timeout
    this.failFast = options.failFast === true
    this.store = options.store || new MemoryStore()
  }

  async _tryLock(): Promise<ReleaseLock | void> {
    this.ref()
    const lockId = uuid()

    await this.store.set(this.name, lockId, {
      notExists: true,

      // expiry is required, 10s is the default - this helps
      // avoid a deadlock situation in which a lock may never
      // have been unlocked - so it will be auto-unlocked by the
      // store releasing the key
      expires: this.timeout || 10 * 1000,
    })
    if (lockId === await this.store.get(this.name)) {
      return () => {
        return this.store.del(this.name).then(val => {
            this.unref()
            return val
          }, () => this.unref())
      }
    }

    if (this.failFast) {
      throw new Error(Errors.COULD_NOT_LOCK)
    }
  }

  /**
   * Lock the mutex.
   * @returns {Promise<ReleaseLock>} resolves when mutex is available with a function that can release the mutex
   */
  async lock(): Promise<ReleaseLock> {
    const start = Date.now()
    const timeout = this.timeout || Infinity

    // spin until a lock is obtained or a timeout expires
    while (Date.now() - start < timeout) {
      const unlock = await this._tryLock()
      if (unlock) {
        return unlock
      }

      await delay(TIME_BETWEEN_SPINS)
    }

    throw new Error(Errors.TIMEOUT)
  }
}
