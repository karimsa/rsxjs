/**
 * @file src/mutex/index.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Deferred, defer } from '../types'

export class Mutex {
  private isLocked: boolean = false
  private requests: Deferred<void>[] = []

  lock(): Promise<void> {
    const wasLocked = this.isLocked
    this.isLocked = true

    if (!wasLocked) {
      return Promise.resolve()
    }

    const deferred: Deferred<void> = defer()
    this.requests.push(deferred)
    return deferred.promise
  }

  unlock() {
    const req = this.requests.pop()

    if (req) {
      req.resolve()
    }
  }
}

export function create(): Mutex {
  return new Mutex()
}
