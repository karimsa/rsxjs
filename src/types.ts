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
