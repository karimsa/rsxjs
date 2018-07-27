/**
 * @file src/coroutine/co.ts
 * @description Tiny coroutine runtime to provide features like canceling &
 * deferrals.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import * as Deferral from '../deferral'
import { DeferFunction } from '../deferral/types'

export interface Cancelable<T> extends Promise<T> {
  /**
   * Cancels the underlying operation.
   * @returns {boolean} true if the operation fully completed before first cancel was called
   */
  cancel(): Promise<boolean>
}

export function co<T>(fn: (defer: DeferFunction) => Iterator<any>): Cancelable<T> {
  const state: {
    isCanceled: boolean
    isDone: null | boolean
    onCancel: ((isDone: boolean) => void)[]
  } = {
    isCanceled: false,
    isDone: null,
    onCancel: [],
  }

  const p: Cancelable<T> = Deferral.fromAsync(async function routine(defer): Promise<T | void> {
    const it = fn(defer)
    let lastValue: any

    // run individual steps until completion, each result is awaited and passed
    // onto the next step - so anything can be yielded from the generator
    // the actual runtime that will be used is regenerator-runtime until node v6
    // goes EOL, this just wraps it
    while (!state.isCanceled) {
      const {
        done,
        value,
      } = it.next(lastValue)
      lastValue = await value

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