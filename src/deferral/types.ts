/**
 * @file src/deferral/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export type AsyncDeferral<T> = (defer: DeferFunction, ...args: any[]) => T

export type CleanupFunction = () => Promise<void> | void
export type DeferFunction = (cleanup: CleanupFunction) => void

export class DeferredOperation {
  private deferred: CleanupFunction[] = []

  defer(cleanup: CleanupFunction): void {
    this.deferred.push(cleanup)
  }

  async cleanup(): Promise<void> {
    for (const cleanup of this.deferred) {
      await cleanup()
    }
  }
}
