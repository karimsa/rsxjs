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
  const d: Deferred<T> = {
    resolve() {},
    reject() {},
    promise: new Promise<T>((resolve, reject) => {
      // seems that TS promise implementation seems to
      // evaluate promise synchronously? wtf. -> 'd' does
      // not seem to exist without the call to nextTick
      process.nextTick(() => {
        d.resolve = resolve
        d.reject = reject
      })
    })
  }

  return d
}
