/**
 * @file src/coroutine/co.ts
 * @description Tiny coroutine runtime to provide features like canceling &
 * deferrals.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import * as Deferral from '../deferral/from-async'
import { DeferFunction } from '../deferral/types'

export interface Cancelable<T> extends Promise<T> {
  /**
   * Cancels the underlying operation.
   * @returns {boolean} true if the operation fully completed before first cancel was called
   */
  cancel(): Promise<boolean>
}

type Wrappable<T> = (...args: any[]) => Cancelable<T>

function wrap<T, F extends Wrappable<T> = Wrappable<T>, G = any>(
  fn: (defer: DeferFunction, ...args: any[]) => Iterator<any>
): F {
  function go(this: G, ...args: any[]): Cancelable<T> {
    const state: {
      isCanceled: boolean
      isDone: null | boolean
      onCancel: ((isDone: boolean) => void)[]
    } = {
      isCanceled: false,
      isDone: null,
      onCancel: [],
    }

    const ctx = this
    const p: Cancelable<T> = Deferral.fromAsync(async function routine(defer): Promise<T | void> {
      const it = fn.call(ctx, defer, ...args)
      let lastValue: any
      let lastError: Error | void

      // run individual steps until completion, each result is awaited and passed
      // onto the next step - so anything can be yielded from the generator
      // the actual runtime that will be used is regenerator-runtime until node v6
      // goes EOL, this just wraps it
      while (!state.isCanceled) {
        const {
          done,
          value,
        } = lastError ? it.throw(lastError) : it.next(lastValue)

        try {
          lastValue = await value
          lastError = undefined
        } catch (err) {
          lastValue = undefined
          lastError = err
        }
  
        if (done) {
          state.isDone = true
          return lastValue
        }
      }
  
      state.isDone = false
  
      for (const resolve of state.onCancel) {
        resolve(state.isDone)
      }
    })() as any
  
    p.cancel = function () {
      state.isCanceled = true
      return new Promise<boolean>(resolve => {
        if (state.isDone !== null) {
          return resolve(state.isDone)
        }
  
        state.onCancel.push(resolve)
      })
    }
  
    return p
  }

  return go as any
}

function runRoutine<T>(fn: (defer: DeferFunction) => Iterator<any>): Cancelable<T> {
  return wrap<T>(fn)()
}

export const co: {
  wrap: typeof wrap
} & typeof runRoutine = Object.assign(runRoutine, { wrap })
