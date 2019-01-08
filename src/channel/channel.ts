/**
 * @file src/channel/channel.ts
 * @description Based on Go's channels to provide CSP-style programming in JS.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import createDebug from 'debug'
import { typeCheck } from '@foko/type-check'

const debug = createDebug('rsxjs:channel')

import { Deferred, defer } from '../types'
import { isDefined, any, delay } from '../utils'

interface IChannel<T> {
  close(): void

  // default R/W methods
  select(): TakeResult<T>
  take(timeout?: number): Promise<TakeResult<T>>
  put(value: T, timeout?: number): Promise<PutResult>

  // support opposite direction
  rselect(): TakeResult<T>
  rtake(timeout?: number): Promise<TakeResult<T>>
  lput(value: T, timeout?: number): Promise<PutResult>
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

export class Channel<T> implements IChannel<T> {
  private isOpen: boolean = true
  private readonly buffer: T[] = []
  private putters: {
    signal: Deferred<void>
    value: T
  }[] = []
  private takers: Deferred<T>[] = []

  // this makes the select() magic work
  private selectSymbol = Symbol()
  private static chanMap = new WeakMap<Symbol, Channel<any>>()

  ;[Symbol.toPrimitive]() { return this.selectSymbol }

  static getChannel<T>(sym: symbol): chan<T> {
    const chan = Channel.chanMap.get(sym)
    if (!chan) {
      throw new Error(`Failed to fetch closed channel`)
    }

    return chan as chan<T>
  }

  constructor(
    private readonly config: Partial<ChannelConfig> = {
      bufferSize: 0,
    }
  ) {
    Channel.chanMap.set(this.selectSymbol, this)

    typeCheck('object', config)
    typeCheck('number?', config.bufferSize)
  }

  close(): void {
    this.isOpen = false
    Channel.chanMap.delete(this.selectSymbol)
  }

  private async _put(dir: 'left' | 'right', value: T, timeout?: number): Promise<PutResult> {
    if (!this.isOpen) {
      debug(`refusing to put on a closed channel`)
      return { ok: false }
    }

    // try to pass it to the next taker first
    const nextTaker = dir === 'left' ? this.takers.pop() : this.takers.shift()
    if (nextTaker) {
      debug(`found pending taker, forwarding value`)
      nextTaker.resolve(value)
      return { ok: true }
    }

    // if buffer is full, add a signal listener that
    // will wait for room before pushing
    if (this.buffer.length === this.config.bufferSize) {
      const signal = defer<void>()
      const putter = {
        signal,
        value,
      }
      this.putters.push(putter)
      debug(`added background putter, waiting for signal`)

      if (isDefined(timeout)) {
        const [i] = await any([
          signal.promise,
          delay(timeout),
        ])

        if (i === 0) {
          debug(`background signal received for putter, value was read`)
        } else {
          debug(`background putter timed out`)

          // unfortunately need to resort to O(n) since the indexes
          // will shift while waiting
          this.putters = this.putters.filter(putterInList => {
            return putterInList !== putter
          })
        }

        return {
          ok: i === 0,
        }
      }

      await signal.promise
      return { ok: true }
    }

    if (dir === 'right') {
      debug(`putter wrote value to the right of the buffer`)
      this.buffer.push(value)
    } else {
      debug(`putter wrote value to the left of the buffer`)
      this.buffer.unshift(value)
    }
    return { ok: true }
  }

  put(value: T, timeout?: number) {
    return this._put('right', value, timeout)
  }

  lput(value: T, timeout?: number) {
    return this._put('left', value, timeout)
  }

  private async _take(dir: 'left' | 'right', timeout?: number): Promise<TakeResult<T>> {
    const { value, ok } = (dir === 'left' ? this.select() : this.rselect())
    if (ok) {
      return { value, ok }
    }

    if (!this.isOpen) {
      debug(`channel is closed & empty, refusing to take`)
      return { ok: false }
    }

    if (this.buffer.length === 0) {
      const nextPutter = dir === 'left' ? this.putters.shift() : this.putters.pop()
      if (nextPutter) {
        nextPutter.signal.resolve()
        debug(`taker found an empty buffer & a background putter, stealing value`)
        return {
          ok: true,
          value: nextPutter.value,
        }
      }

      const p = defer<T>()
      this.takers.push(p)
      debug(`adding taker to background list`)

      if (isDefined(timeout)) {
        const [i, value] = await any([
          p.promise,
          delay(timeout),
        ])

        if (i === 0) {
          debug(`received value from background taker`)
          return {
            ok: true,
            value,
          }
        }

        debug(`failed to received value from background taker, timed out`)
        this.takers = this.takers.filter(takerFromList => {
          return takerFromList !== p
        })
        return {
          ok: false,
        }
      }

      const value = await p.promise
      debug(`received value from background taker`)
      return {
        ok: true,
        value,
      }
    }

    const poppedValue = dir === 'left' ? 
      this.buffer.shift() as T :
      this.buffer.pop() as T

    debug(`read value from static buffer`)
    return {
      ok: !!poppedValue,
      value: poppedValue,
    }
  }

  take(timeout?: number) {
    return this._take('left', timeout)
  }

  rtake(timeout?: number) {
    return this._take('right', timeout)
  }

  private _select(dir: 'left' | 'right'): TakeResult<T> {
    if (this.buffer.length > 0) {
      debug(`selected value from %s of buffer`, dir)
      return {
        value: dir === 'left' ? this.buffer.shift() : this.buffer.pop(),
        ok: true,
      }
    }

    // try to steal from a putter
    const nextPutter = dir === 'left' ? this.putters.shift() : this.putters.pop()
    if (nextPutter) {
      debug(`selected value from background putter`)
      nextPutter.signal.resolve()
      return {
        value: nextPutter.value,
        ok: true,
      }
    }

    debug(`failed to select a value`)
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
