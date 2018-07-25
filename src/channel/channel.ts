/**
 * @file src/channel/channel.ts
 * @description Based on Go's channels to provide CSP-style programming in JS.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { typeCheck } from '@foko/type-check'
import { isDefined } from '../utils'
import * as Timeout from '../timeout'

interface IChannel<T> {
  take(timeout?: number): Promise<T>
  put(value: T, timeout?: number): Promise<void>
}

interface ChannelConfig {
  bufferSize: number
  pollInterval: number
}

const nil = {} as any

class BlockingChannel<T> implements IChannel<T> {
  private value: T = nil
  
  constructor(
    private readonly config: ChannelConfig
  ) {}
  
  async put(value: T): Promise<void> {
    return this.poll(false).then(() => {
      this.value = value
    })
  }
  
  async take(): Promise<T> {
    return this.poll(true).then(() => {
      const v = this.value
      this.value = nil
      return v
    })
  }
  
  private poll(shouldExist: boolean): Promise<void> {
    const exists = this.value !== nil
    if (shouldExist === exists) {
      return Promise.resolve()
    }
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.poll(shouldExist)
          .then(resolve, reject)
      }, this.config.pollInterval)
    })
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
}

export class Channel<T> implements IChannel<T> {
  private readonly chan: IChannel<T>
  
  constructor(
    c: Partial<ChannelConfig> = {}
  ) {
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
  
  private attempt<G>(p: Promise<G>, timeout?: number): Promise<G> {
    if (isDefined(timeout)) {
      return Timeout.fromPromise(p,{
        timeout
      })
    }
    
    return p
  }
  
  async put(value: T, timeout?: number): Promise<void> {
    return this.attempt(
      this.chan.put(value),
      timeout
    )
  }
  
  async take(timeout?: number): Promise<T> {
    return this.attempt(
      this.chan.take(),
      timeout,
    )
  }
}