/**
 * @file src/waitgroup/waitgroup.ts
 * @description Better concurrency synchronization - wait for stuff to be done. Based on Go's standard library.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { defer, Deferred } from '../types'

type Waitable =
  number |
  (() => number) |
  Promise<any> |
  (() => Promise<any>)

export class WaitGroup {
  private numTasks: number = 0
  private waiters: Deferred<void>[] = []

  public add(ctr: Waitable): void {
    if (typeof ctr === 'number' || ctr === undefined || ctr === null) {
      this.numTasks += ctr
      return
    }

    if (typeof ctr === 'function') {
      return this.add(ctr())
    }
    
    if ('then' in ctr && typeof ctr.then === 'function') {
      this.numTasks++
      ctr.then(() => { this.done() }, err => { this.done(err) })
      return
    }
    
    throw new Error(`Unexpected value given to add: ${typeof ctr}`)
  }

  done(err?: Error): void {
    // mark one completion
    this.add(-1)
    if (this.numTasks < 0) {
      throw new Error(`WaitGroup.done() called too many times`)
    }

    // unblock all waiters
    if (this.numTasks < 1) {
      while (this.waiters.length > 0) {
        const waiter = this.waiters.pop()
        if (waiter) {
          if (err) { waiter.reject(err) }
          else { waiter.resolve() }
        }
      }
    }
  }

  // create a new waiter with an optional timeout
  wait(t?: number): Promise<void> {
    if (this.numTasks < 1) {
      return Promise.resolve()
    }

    const d = defer<void>()
    this.waiters.push(d)
    if (t) {
      const timer = setTimeout(() => {
        const i = this.waiters.indexOf(d)
        this.waiters.splice(i, 1)
      }, t)
      d.promise.then(() => clearTimeout(timer))
    }
    return d.promise
  }
}
