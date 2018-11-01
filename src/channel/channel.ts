/**
 * @file src/channel/channel.ts
 * @description Based on Go's channels to provide CSP-style programming in JS.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { typeCheck } from '@foko/type-check'

import { select } from './select'
import * as Errors from '../errors'
import { isDefined, any } from '../utils'
import { after as timeoutAfter } from '../timeout/after'
import { Deferred, defer } from '../types'

interface IChannel<T> {
  select(): TakeResult<T>
  take(timeout?: number): Promise<T>
  put(value: T, timeout?: number): Promise<void>
}

interface ChannelConfig {
  bufferSize: number
}

interface PutResult {
  ok: boolean
}

interface TakeResult<T> {
  value?: T
  ok: boolean
}

class BufferedChannel<T> implements IChannel<T> {
  private readonly buffer: T[] = []
  private readonly putters: {
    signal: Deferred<void>
    value: T
  }[] = []
  private readonly takers: Deferred<T>[] = []

  constructor(
    private readonly config: ChannelConfig
  ) {}

  async put(v: T): Promise<void> {
    // try to pass it to the next taker first
    const nextTaker = this.takers.pop()
    if (nextTaker) {
      nextTaker.resolve(v)
      return
    }

    // if buffer is full, add a signal listener that
    // will wait for room before pushing
    if (this.buffer.length === this.config.bufferSize) {
      const signal = defer<void>()
      this.putters.push({
        signal,
        value: v,
      })

      return signal.promise
    }

    this.buffer.push(v)
  }

  async take(): Promise<T> {
    if (this.buffer.length === 0) {
      const nextPutter = this.putters.shift()
      if (nextPutter) {
        nextPutter.signal.resolve()
        return nextPutter.value
      }

      const p = defer<T>()
      this.takers.push(p)
      return p.promise
    }

    return this.buffer.shift() as T
  }

  select(): TakeResult<T> {
    if (this.buffer.length > 0) {
      return {
        value: this.buffer.shift(),
        ok: true,
      }
    }

    // try to steal from a putter
    const nextPutter = this.putters.shift()
    if (nextPutter) {
      nextPutter.signal.resolve()
      return {
        value: nextPutter.value,
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
    }
    
    typeCheck('object', c)
    typeCheck('number?', c.bufferSize)
      
    if (isDefined(c.bufferSize)) {
      config.bufferSize = c.bufferSize as any
    }

    this.chan = new BufferedChannel(config) as any
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

  private readOnlyChan?: ReadOnlyChannel<T>
  readOnly(): ReadOnlyChannel<T> {
    return (this.readOnlyChan = this.readOnlyChan || new ReadOnlyChannel(this))
  }

  private writeOnlyChan?: WriteOnlyChannel<T>
  writeOnly(): WriteOnlyChannel<T> {
    return (this.writeOnlyChan = this.writeOnlyChan || new WriteOnlyChannel(this))
  }
}

export class ReadOnlyChannel<T> {
  constructor(
    private readonly chan: Channel<T>,
  ) {}

  take() { return this.chan.take() }
  select() { return this.chan.select() }
  [Symbol.asyncIterator]() { return this.chan[Symbol.asyncIterator]() }
  [Symbol.toPrimitive]() { return this.chan[Symbol.toPrimitive]() }
}

export class WriteOnlyChannel<T> {
  constructor(
    private readonly chan: Channel<T>,
  ) {}

  put(value: T, timeout?: number) { return this.chan.put(value, timeout) }
}

export type readOnlyChan<T> = ReadOnlyChannel<T> & symbol
export type writeOnlyChan<T> = WriteOnlyChannel<T> & symbol
export type chan<T> = Channel<T> & symbol

export function makeChan<T>(opts?: Partial<ChannelConfig>): chan<T> {
  return new Channel(opts) as any
}
