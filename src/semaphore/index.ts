/**
 * @file src/semaphore/index.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Mutex } from '../mutex'
import { Lock, Deferred, defer, ReleaseLock } from '../types'

export class Semaphore extends Lock {
  private _avail: number
  private mutex: Mutex = new Mutex()

  constructor(
    private readonly size: number
  ) {
    super()
    this._avail = size
  }

  get available() {
    return this._avail
  }

  set available(value) {
    this._avail = value

    if (value === this.size) {
      this.unref()
    } else {
      this.ref()
    }
  }

  /**
   * Semaphore availability is determine by any tokens
   * available for use. Simple integer is enough for this.
   */
  isLocked(): boolean {
    return this.available === 0
  }

  async lock(): Promise<ReleaseLock> {
    const releaseMutex = await this.mutex.lock()

    const unlock: ReleaseLock = async () => {
      const innerRelease = await this.mutex.lock()

      this.available = Math.min(this.available + 1, this.size)

      const req = this.requests.shift()
      if (req) {
        --this.available
        req.resolve()
      }

      innerRelease()
    }

    if (!this.isLocked()) {
      --this.available
      releaseMutex()
      return Promise.resolve(unlock)
    }

    const deferred: Deferred<ReleaseLock> = defer()
    this.requests.push(Object.assign({ unlock }, deferred))
    releaseMutex()

    return deferred.promise
  }
}
