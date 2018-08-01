/**
 * @file src/timeout/after.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { makeChan, chan } from '../channel'

export function after(timeout: number): chan<void> {
  const quit = makeChan<void>({ bufferSize: 1 })
  setTimeout(() => {
    quit.put(undefined)
    quit.close()
  }, timeout)
  return quit
}
