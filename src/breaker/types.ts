/**
 * @file src/breaker/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { v4 as uuid } from 'uuid'
import createDebug from 'debug'

const debug = createDebug('rsxjs')

import { Store, MemoryStore, State } from '../store'


export interface BreakerOptions {
  name?: string
  maxErrors: number
  timeout: number
  store: Store
}

export type BreakerOptionsGiven = Partial<BreakerOptions>

export function defaults(config?: BreakerOptionsGiven): BreakerOptions {
  const updatedConfig: BreakerOptions = Object.assign({}, DefaultBreakerOptions)

  if (!config) {
    return updatedConfig
  }

  if (config.maxErrors !== undefined) {
    const { maxErrors } = config

    if (
      typeof maxErrors !== 'number' ||
      maxErrors < -1 ||
      !isFinite(maxErrors) ||
      isNaN(maxErrors)
    ) {
      throw new TypeError(`Unexpected value of type ${typeof maxErrors} given to 'maxErrors'`)
    }

    updatedConfig.maxErrors = maxErrors
  }

  if (config.timeout !== undefined) {
    const { timeout } = config

    if (
      typeof timeout !== 'number' ||
      timeout < -1 ||
      !isFinite(timeout) ||
      isNaN(timeout)
    ) {
      throw new TypeError(`Unexpected value of type ${typeof timeout} given to 'timeout'`)
    }

    updatedConfig.timeout = timeout
  }

  if (config.store) {
    updatedConfig.store = config.store
  }

  if (config.name) {
    updatedConfig.name = config.name
  }

  return updatedConfig
}

export const DefaultBreakerOptions: BreakerOptions = {
  maxErrors: 10,
  timeout: 10 * 1000,
  store: new MemoryStore(),
}

export interface BreakerStateObject {
  numErrors: number
  lastError: string
  lastErrorTime: number
}

export const enum BreakerState {
  OPEN,
  CLOSED,
  HALFOPEN,
}

interface StateCache {
  numErrors: number
  lastErrorTime: number
  state: BreakerState
}

export class CircuitBreaker<T> {
  private readonly namespace: string
  private readonly state: State<BreakerStateObject>

  constructor(private readonly options: BreakerOptions) {
    this.namespace = `rsxjs:breaker:${options.name || uuid()}`
    this.state = new State<BreakerStateObject>({
      store: options.store,
      namespace: this.namespace,
      defaults: {
        numErrors: 0,
        lastError: 'Unknown error',
        lastErrorTime: 0,
      },
    })
  }

  private lastState?: StateCache
  private lastStateTime?: number

  lastStateIsFresh(): boolean {
    return (
      this.lastState !== undefined &&
      this.lastStateTime !== undefined &&
      (Date.now() - this.lastStateTime) < this.options.timeout
    )
  }

  async getFreshState(): Promise<StateCache> {
    const numErrors = await this.state.get('numErrors')
    const lastErrorTime = await this.state.get('lastErrorTime')

    if (debug.enabled) {
      debug(`breaker(${this.namespace}) =>`, { numErrors, lastErrorTime })
      debug(`breaker(${this.namespace}) => state dump`, await this.state.dump())
    }

    const state = getBreakerState({
      numErrors,
      lastErrorTime,
      options: this.options,
    })

    const stateObject = {
      numErrors,
      lastErrorTime,
      state,
    }

    // only cache when we close since during a closed state, all requests
    // can be avoided during the timeout because the state will not change
    if (state === BreakerState.CLOSED) {
      this.lastStateTime = Date.now()
      this.lastState = stateObject
    }

    return stateObject
  }

  async getState(): Promise<StateCache> {
    if (this.lastStateIsFresh() && this.lastState) {
      return this.lastState
    }

    return this.getState()
  }

  async shouldAllowRequest(): Promise<boolean> {
    return BreakerState.CLOSED !== (await this.getState()).state
  }

  async attempt(fn: () => T | Promise<T>): Promise<T> {
    const { numErrors, state } = await this.getState()

    switch (state) {
      case BreakerState.HALFOPEN:
      case BreakerState.OPEN: {
        try {
          debug(`breaker(${this.namespace}) => passing through`)
          const result = await fn()
          debug(`breaker(${this.namespace}) => resetting state: %s`)

          // if we received a default value, no need to send a reset
          // instruction
          if (numErrors > 0) {
            await this.state.reset()
          }

          return result
        } catch (err) {
          await this.state.incr('numErrors')
          await this.state.set('lastError', err.message || String(err))
          await this.state.set('lastErrorTime', Date.now())
          throw err
        }
      }

      default: {
        throw new Error(await this.state.get('lastError'))
      }
    }
  }
}

export interface BreakerFunction<T> {
  (...args: any[]): Promise<T>
  shouldAllowRequest(): Promise<boolean>
}

export function getBreakerState({ numErrors, lastErrorTime, options }: {
  numErrors: number
  lastErrorTime: number
  options: BreakerOptions
}): BreakerState {
  if (numErrors >= options.maxErrors) {
    const elapsed = Date.now() - lastErrorTime

    if (elapsed >= options.timeout) {
      return BreakerState.HALFOPEN
    }

    return BreakerState.CLOSED
  }

  return BreakerState.OPEN
}
