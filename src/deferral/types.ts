/**
 * @file src/deferral/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import createDebug from 'debug'
const debug = createDebug('rsxjs')

export type AsyncDeferral<T> = (defer: DeferFunction, ...args: any[]) => Promise<T>

export type CleanupFunction = () => Promise<void> | void
export type DeferFunction = (cleanup: CleanupFunction) => void

export class DeferredOperation {
  private deferred: CleanupFunction[] = []

  defer(cleanup: CleanupFunction): void {
    debug(`registering deferred operation:`, cleanup)
    this.deferred.push(cleanup)
  }

  async cleanup(): Promise<void> {
    for (const cleanup of this.deferred) {
      debug(`executing deferred operation:`, cleanup)
      await cleanup()
    }
  }
}
