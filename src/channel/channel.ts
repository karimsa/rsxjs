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
  // default R/W methods
  select(): TakeResult<T>
  take(timeout?: number): Promise<T>
  put(value: T, timeout?: number): Promise<void>

  // support opposite direction
  rselect(): TakeResult<T>
  rtake(timeout?: number): Promise<T>
  lput(value: T, timeout?: number): Promise<void>
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

  private async _put(v: T, dir: 'left' | 'right'): Promise<void> {
    // try to pass it to the next taker first
    const nextTaker = dir === 'left' ? this.takers.pop() : this.takers.shift()
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

    if (dir === 'right') {
      this.buffer.push(v)
    } else {
      this.buffer.unshift(v)
    }
  }

  put(v: T): Promise<void> {
    return this._put(v, 'right')
  }

  lput(v: T): Promise<void> {
    return this._put(v, 'left')
  }

  async _take(dir: 'left' | 'right'): Promise<T> {
    if (this.buffer.length === 0) {
      const nextPutter = dir === 'left' ? this.putters.shift() : this.putters.pop()
      if (nextPutter) {
        nextPutter.signal.resolve()
        return nextPutter.value
      }

      const p = defer<T>()
      this.takers.push(p)
      return p.promise
    }

    if (dir === 'left') {
      return this.buffer.shift() as T
    }
    return this.buffer.pop() as T
  }

  take() {
    return this._take('left')
  }

  rtake() {
    return this._take('right')
  }

  _select(dir: 'left' | 'right'): TakeResult<T> {
    if (this.buffer.length > 0) {
      return {
        value: dir === 'left' ? this.buffer.shift() : this.buffer.pop(),
        ok: true,
      }
    }

    // try to steal from a putter
    const nextPutter = dir === 'left' ? this.putters.shift() : this.putters.pop()
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

  select() {
    return this._select('left')
  }

  rselect() {
    return this._select('right')
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
  
  private async _put(dir: 'left' | 'right', value: T, timeout?: number): Promise<PutResult> {
    if (!this.isOpen) {
      throw new Error(Errors.CLOSED_CHAN)
    }

    if (!isDefined(timeout)) {
      if (dir === 'right') {
        await this.chan.put(value)
      } else {
        await this.chan.lput(value)
      }

      return { ok: true }
    }

    const [i] = await any([
      dir === 'right' ? this.chan.put(value) : this.chan.lput(value),
      timeoutAfter(timeout).take(),
    ])
    return { ok: i === 0 }
  }

  put(value: T, timeout?: number) {
    return this._put('right', value, timeout)
  }

  lput(value: T, timeout?: number) {
    return this._put('left', value, timeout)
  }

  private async _take(dir: 'left' | 'right', timeout?: number): Promise<TakeResult<T>> {
    const { value, ok } = (dir === 'left' ? this.chan.select() : this.chan.rselect())
    if (ok) {
      return { value, ok }
    }

    if (!this.isOpen) {
      throw new Error(Errors.CLOSED_CHAN)
    }

    if (!isDefined(timeout)) {
      const value = await (dir === 'left' ? this.chan.take() : this.chan.rtake())
      return { value, ok: true }
    }

    return select({
      [this.chan]: (value: T) => ({ value, ok: true }),
      [timeoutAfter(timeout)]: () => ({ ok: false }),
    })
  }

  take(timeout?: number) {
    return this._take('left', timeout)
  }

  rtake(timeout?: number) {
    return this._take('right', timeout)
  }

  select() {
    return this.chan.select()
  }

  rselect() {
    return this.chan.rselect()
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
