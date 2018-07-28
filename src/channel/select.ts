/**
 * @file src/channel/select.ts
 * @description Control flow helper for channels.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Channel, chan } from './channel'

type SelectStatement = {
  [key in chan<any> | '_']?: (value?: any) => any
}

export function select(cases: SelectStatement): Promise<any> {
  const defaultCase = cases._

  const syms: symbol[] = Object.getOwnPropertySymbols(cases)
  if (syms.length === 0) {
    throw new Error('No channels given to select')
  }

  const chans: chan<any>[] = []
  for (const sym of syms) {
    chans.push(Channel.getChannel(sym))
  }

  function poll(): any {
    for (const chan of chans) {
      const { value, ok } = chan.select()

      if (ok) {
        const sym = chan[Symbol.toPrimitive]()
        return (cases as any)[sym](value)
      }
    }

    if (defaultCase) {
      return defaultCase()
    }

    // go async if default case is not hit
    return new Promise(resolve => setTimeout(() => resolve(poll()), 0))
  }

  return poll()
}
