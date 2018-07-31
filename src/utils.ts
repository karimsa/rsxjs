/**
 * @file src/utils.ts
 * @description Some common utilities.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import createDebugger from 'debug'
const debug = createDebugger('rsxjs:utils')

export function isDefined<T>(v: T | undefined | null): v is T {
  return (
    v !== undefined &&
    v !== null
  )
}

export function debounce<T extends Function>(fn: T, timeout: number): T {
  const state: {
    lastCall?: number
    timer?: NodeJS.Timer
  } = {}

  return function debouncedFn(this: any, ...args: any[]): any {
    const since = Date.now() - (state.lastCall || 0)
    debug(`debounced function called =>`, {
      since,
      timeout,
    })

    if (!state.lastCall || since < timeout) {
      state.lastCall = Date.now()

      if (state.timer) {
        clearTimeout(state.timer)
      }

      state.timer = setTimeout(
        () => debouncedFn.apply(this, args),
        timeout+1,
      )
      return
    }

    return fn.apply(this, args)
  } as any
}

export function delay(timeout: number): Promise<void> {
  return new Promise(resolve => setTimeout(() => resolve(), timeout))
}
