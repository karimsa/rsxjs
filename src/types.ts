/**
 * @file src/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

// waiting for TS to add support for variadic generics
export type AsyncFunction<T> = (...args: any[]) => Promise<T>
export type SyncFunction<T> = (...args: any[]) => T

export type Callback = (err: Error | null, ...args: any[]) => void

export interface LinkedNode<T> {
  prev?: LinkedNode<T>
  next?: LinkedNode<T>
  value: T
}

export interface Deferred<T> {
  promise: Promise<T>
  resolve: (value?: T) => void
  reject: (err: Error) => void
}

export function defer<T>(): Deferred<T> {
  const d: Deferred<T> = <Deferred<T>>{}

  d.promise = new Promise<T>((resolve, reject) => {
    // seems that TS promise implementation seems to
    // evaluate promise synchronously? wtf. -> 'd' does
    // not seem to exist without the call to nextTick
    d.resolve = resolve
    d.reject = reject
  })

  return d
}

/**
 * Use simple empty timer to ensure that in a locked state,
 * the event loop stays alive.
 */
export abstract class Referred {
  private _ref?: NodeJS.Timer
  protected ref() { this._ref = setInterval(() => {}, 2**31 - 1) }
  protected unref() { if (this._ref) clearTimeout(this._ref) }
}

/**
 * Simple abstract class that defines how a lock should work.
 * Generic shape for both mutexes and semaphores.
 */
export type ReleaseLock = (() => void) | (() => Promise<void>)
export abstract class Lock extends Referred {
  protected requests: (Deferred<ReleaseLock> & {
    unlock: ReleaseLock
  })[] = []
  abstract lock(failWithoutLock: boolean): Promise<ReleaseLock>
}
