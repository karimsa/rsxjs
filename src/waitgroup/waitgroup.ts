/**
 * @file src/waitgroup/waitgroup.ts
 * @description Better concurrency synchronization - wait for stuff to be done. Based on Go's standard library.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { typeCheck } from '@foko/type-check'
import * as Timeout from '../timeout'

type Waitable =
  number |
  (() => number) |
  Promise<any> |
  (() => Promise<any>)

interface IWaitGroup<T extends Waitable> {
  add(v?: T): void
  wait(t?: number): Promise<void>
}

class RawWaitGroup implements IWaitGroup<number> {
  private stackSize: number = 0
  
  add(ctr: number = 1): void {
    if (typeof ctr !== 'number' || ctr !== Math.floor(ctr)) {
      throw new Error(`Unexpected value given to add: ${ctr}`)
    }
    
    this.stackSize += ctr
  }
  
  done(): void {
    this.stackSize -= 1
    
    if (this.stackSize < 0) {
      this.stackSize = 0
      throw new Error(`WaitGroup.done() called too many times`)
    }
  }
  
  wait(timeout?: number): Promise<void> {
    typeCheck('number?', timeout)
    
    const wg = this
    const fn = () => new Promise<void>(done => {
      function test() {
        if (wg.stackSize === 0) {
          return done()
        }
        
        // simply return to the event loop until next stack completion
        setTimeout(test, 0)
      }
      
      test()
    })
    
    if (typeof timeout === 'number') {
      return Timeout.fromAsync(fn, {
        timeout,
      })()
    }
    
    return fn()
  }
}

class AsyncWaitGroup implements IWaitGroup<Promise<any>> {
  private readonly wg = new RawWaitGroup()
  
  add(p: Promise<any>): void {
    this.wg.add(1)
    p.then(v => {
      this.wg.done()
      return v
    }, err => {
      this.wg.done()
      throw err
    })
  }
  
  wait(t?: number): Promise<void> {
    return this.wg.wait(t)
  }
}

export class WaitGroup implements IWaitGroup<Waitable> {
  private readonly wgCtr = new RawWaitGroup()
  private readonly wgAsync = new AsyncWaitGroup()
  
  add(ctr: Waitable): void {
    if (typeof ctr === 'number' || ctr === undefined || ctr === null) {
      return this.wgCtr.add(ctr)
    }
    
    if (typeof ctr === 'function') {
      return this.add(ctr())
    }
    
    if ('then' in ctr && typeof ctr.then === 'function') {
      return this.wgAsync.add(ctr)
    }
    
    throw new Error(`Unexpected value given to add: ${typeof ctr}`)
  }
  
  done(): void {
    return this.wgCtr.done()
  }
  
  async wait(t?: number): Promise<void> {
    await Promise.all([
      this.wgCtr.wait(t),
      this.wgAsync.wait(t),
    ])
  }
}
