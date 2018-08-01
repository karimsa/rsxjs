/**
 * @file src/mutex/index.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import * as Errors from '../errors'
import { Deferred, defer, Lock, ReleaseLock } from '../types'

import createDebugger from 'debug'
const debug = createDebugger('rsxjs:mutex')

export class Mutex extends Lock {
  /**
   * For a mutex, the state is simply binary so we can use
   * a boolean for internal storage & a simple getter for the
   * boolean to provide external readonly access.
   */
  private _locked: boolean = false
  isLocked(): boolean { return this._locked }

  /**
   * Lock the mutex.
   * @returns {Promise<ReleaseLock>} resolves when mutex is available with a function that can release the mutex
   */
  async lock(failWithoutLock: boolean = false): Promise<ReleaseLock> {
    /**
     * Single-use unlocker. Created for each locked
     * state created so that unlocks are not leaked.
     */
    let thisWasUnlocked = false
    const unlock = () => {
      if (thisWasUnlocked) {
        throw new Error('Mutex has already been released')
      }

      thisWasUnlocked = true
      const req = this.requests.shift()

      if (req) {
        debug(`passing mutex onto next listener`)
        req.resolve(req.unlock)
      } else {
        debug(`unlocked mutex`)
        this.unref()
        this._locked = false
      }
    }

    const wasLocked = this._locked
    this._locked = true

    if (!wasLocked) {
      debug(`locked mutex`)
      this.ref()
      return unlock
    }

    if (failWithoutLock) {
      throw new Error(Errors.COULD_NOT_LOCK)
    }

    /**
     * If mutex is currently locked, just push the attempt to lock
     * into the queue.
     */
    const deferred: Deferred<ReleaseLock> = defer()
    this.requests.push(Object.assign({ unlock }, deferred))
    return deferred.promise
  }
}
