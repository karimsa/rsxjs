/**
 * @file src/channel/channel.ts
 * @description Based on Go's channels to provide CSP-style programming in JS.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { typeCheck } from '@foko/type-check'

import * as Errors from '../errors'
import { isDefined, delay } from '../utils'
import * as Timeout from '../timeout'
import { Deferred, defer } from '../types'

interface IChannel<T> {
  select(): {
    value?: T
    ok: boolean
  }
  take(timeout?: number): Promise<T>
  put(value: T, timeout?: number): Promise<void>
}

interface ChannelConfig {
  bufferSize: number
  pollInterval: number
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
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          this.put(v).then(resolve, reject)
        }, 0)
      })
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

export class Channel<T> implements IChannel<T> {
  private readonly chan: IChannel<T>
  private isOpen: boolean = true
  private selectSymbol = Symbol()

  private static chanMap: {
    [key in any]: Channel<any>
  } = {}

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
      this.chan = new BufferedChannel(config)
    } else {
      this.chan = new BlockingChannel(config)
    }
  }

  close(): void {
    this.isOpen = false
    delete Channel.chanMap[this.selectSymbol as any]
  }

  private attempt<G>(makeP: () => Promise<G>, timeout?: number): Promise<G> {
    if (!this.isOpen) {
      throw new Error(Errors.CLOSED_CHAN)
    }

    const p = makeP()

    if (isDefined(timeout)) {
      return Timeout.fromPromise(p,{
        timeout
      })
    }
    
    return p
  }
  
  async put(value: T, timeout?: number): Promise<void> {
    return this.attempt(
      () => this.chan.put(value),
      timeout
    )
  }
  
  async take(timeout?: number): Promise<T> {
    const { value, ok } = this.select()
    if (ok) {
      return value as T
    }
    
    return this.attempt(
      () => this.chan.take(),
      timeout,
    )
  }

  select() {
    return this.chan.select()
  }

  private async* range(): AsyncIterableIterator<T> {
    while (this.isOpen) {
      yield await this.take()
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
