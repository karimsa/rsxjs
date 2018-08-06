/**
 * @file src/channel/channel.ts
 * @description Based on Go's channels to provide CSP-style programming in JS.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { typeCheck } from '@foko/type-check'

import { select } from './select'
import * as Errors from '../errors'
import { isDefined, delay, any } from '../utils'
import { after as timeoutAfter } from '../timeout/after'
import { Deferred, defer } from '../types'

interface IChannel<T> {
  select(): TakeResult<T>
  take(timeout?: number): Promise<T>
  put(value: T, timeout?: number): Promise<void>
}

interface ChannelConfig {
  bufferSize: number
  pollInterval: number
}

interface PutResult {
  ok: boolean
}

interface TakeResult<T> {
  value?: T
  ok: boolean
}

class BlockingChannel<T> implements IChannel<T> {
  private buffer: {
    value: T
    p: Deferred<void>
  }[] = []

  constructor(
    private readonly config: ChannelConfig
  ) {}

  async put(value: T): Promise<void> {
    const p = defer<void>()
    this.buffer.push({
      value,
      p,
    })
    return p.promise
  }

  async take(): Promise<T> {
    const { value, ok } = this.select()
    if (ok) {
      return value as T
    }

    await delay(this.config.pollInterval)
    return this.take()
  }

  select() {
    const b = this.buffer.shift()
    if (b) {
      b.p.resolve()
      return {
        ok: true,
        value: b.value,
      }
    }

    return {
      ok: false,
    }
  }
}

class BufferedChannel<T> implements IChannel<T> {
  private readonly buffer: T[] = []

  constructor(
    private readonly config: ChannelConfig
  ) {}
  
  async put(v: T): Promise<void> {
    if (this.buffer.length === this.config.bufferSize) {
      await delay(this.config.pollInterval)
      return this.put(v)
    }

    this.buffer.push(v)
  }
  
  async take(): Promise<T> {
    if (this.buffer.length === 0) {
      return new Promise<T>((resolve, reject) => {
        setTimeout(() => {
          this.take().then(resolve, reject)
        }, this.config.pollInterval)
      })
    }
    
    return this.buffer.shift() as T
  }

  select() {
    if (this.buffer.length > 0) {
      return {
        value: this.buffer.shift(),
        ok: true,
      }
    }

    return {
      ok: false,
    }
  }
}

export class Channel<T> {
  private readonly chan: IChannel<T> & symbol
  private isOpen: boolean = true

  // this makes the select() magic work
  private selectSymbol = Symbol()
  private static chanMap: { [key in any]: Channel<any> } = {}

  ;[Symbol.toPrimitive]() { return this.selectSymbol }

  static getChannel<T>(sym: symbol): chan<T> {
    const chan = Channel.chanMap[sym as any]
    if (!chan) {
      throw new Error(`Failed to fetch closed channel`)
    }

    return chan as chan<T>
  }

  constructor(
    c: Partial<ChannelConfig> = {}
  ) {
    Channel.chanMap[this.selectSymbol as any] = this

    const config: ChannelConfig = {
      bufferSize: 0,
      pollInterval: 10,
    }
    
    typeCheck('object', c)
    typeCheck('number?', c.bufferSize)
    typeCheck('number?', c.pollInterval)
      
    if (isDefined(c.bufferSize)) {
      config.bufferSize = c.bufferSize as any
    }
      
    if (isDefined(c.pollInterval)) {
      config.pollInterval = c.pollInterval as any
    }

    if (config.bufferSize > 0) {
      this.chan = new BufferedChannel(config) as any
    } else {
      this.chan = new BlockingChannel(config) as any
    }
  }

  close(): void {
    this.isOpen = false
    delete Channel.chanMap[this.selectSymbol as any]
  }
  
  async put(value: T, timeout?: number): Promise<PutResult> {
    if (!this.isOpen) {
      throw new Error(Errors.CLOSED_CHAN)
    }

    if (!isDefined(timeout)) {
      await this.chan.put(value)
      return { ok: true }
    }

    const [i] = await any([
      this.chan.put(value),
      timeoutAfter(timeout).take(),
    ])
    return { ok: i === 0 }
  }

  async take(timeout?: number): Promise<TakeResult<T>> {
    const { value, ok } = this.chan.select()
    if (ok) {
      return { value, ok }
    }

    if (!this.isOpen) {
      throw new Error(Errors.CLOSED_CHAN)
    }

    if (!isDefined(timeout)) {
      const value = await this.chan.take()
      return { value, ok: true }
    }

    return select({
      [this.chan]: (value: T) => ({ value, ok: true }),
      [timeoutAfter(timeout)]: () => ({ ok: false }),
    })
  }

  select() {
    return this.chan.select()
  }

  async* [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    while (this.isOpen) {
      const { value } = await this.take()
      yield value as T
    }

    while (true) {
      const { value, ok } = this.select()

      if (ok) {
        yield value as T
      } else {
        break
      }
    }
  }

  [Symbol.asyncIterator]() {
    return this.range()
  }

  [Symbol.toPrimitive]() {
    return this.selectSymbol
  }
}

export type chan<T> = Channel<T> & symbol
export function makeChan<T>(opts?: Partial<ChannelConfig>): chan<T> {
  return new Channel(opts) as any
}
