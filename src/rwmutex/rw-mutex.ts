/**
 * @file src/mutex/rw-mutex.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { v4 as uuid } from 'uuid'

import { delay } from '../utils'
import * as Errors from '../errors'
import { ReleaseLock } from '../types'
import { Mutex } from '../mutex/mutex'
import { Store, State, MemoryStore } from '../store'

interface StateShape {
  readerCount: number
  writeAttempts: number
  writerId?: string
}

const TIME_BETWEEN_SPINS = 10

interface LockOptions {
  timeout?: number
  failFast?: boolean
}

export class RWMutex {
  private readonly state: State<StateShape>
  private readonly mux: Mutex

  constructor({ namespace, store }: {
    namespace?: string
    store?: Store
  } = {}) {
    const ns = `rsxjs:rwmux:${namespace || uuid()}`
    store = store || new MemoryStore()

    this.mux = new Mutex({
      name: `mux:${ns}`,
      store,
    })
    this.state = new State({
      store,
      namespace: ns,
      defaults: {
        readerCount: 0,
        writeAttempts: 0,
      },
    })
  }

  private async tryRLock(): Promise<ReleaseLock> {
    const unlock = await this.mux.lock()
    try {
      if (
        // if a writer has a lock,
        (await this.state.get('writerId')) ||

        // or a writer is waiting for a lock
        (await this.state.get('writeAttempts')) > 0
      ) {
        throw new Error(Errors.COULD_NOT_LOCK)
      }

      await this.state.incr('readerCount')
    } finally {
      await unlock()
    }

    return async () => {
      const unlock = await this.mux.lock()
      try {
        // verify that a writer has not taken over due to
        // expiry
        if (!await this.state.get('writerId')) {
          await this.state.decr('readerCount')
        }
      } finally {
        await unlock()
      }
    }
  }

  private async tryWLock(writerId: string, attempts: number): Promise<ReleaseLock> {
    const unlock = await this.mux.lock()
    try {
      if (
        // if a writer currently has the lock
        (await this.state.get('writerId')) ||

        // or if at least one reader has a lock
        (await this.state.get('readerCount')) > 0
      ) {
        if (attempts === 0) {
          await this.state.incr('writeAttempts')
        }

        throw new Error(Errors.COULD_NOT_LOCK)
      }

      await this.state.set('writerId', writerId)
    } finally {
      await unlock()
    }

    return async () => {
      const unlock = await this.mux.lock()
      try {
        // verify that we still have ownership
        if (writerId === await this.state.get('writerId')) {
          await this.state.reset()
        }
      } finally {
        await unlock()
      }
    }
  }

  private async spinAndLock(
    lockFn: (attempts: number) => Promise<ReleaseLock>,
    { timeout, failFast }: LockOptions = {}
  ): Promise<ReleaseLock> {
    if (!timeout) {
      timeout = Infinity
    }

    if (failFast) {
      return lockFn(0)
    }

    const start = Date.now()
    let attempts = 0
    while (Date.now() - start < timeout) {
      try {
        const unlock = await lockFn(attempts++)
        return unlock
      } catch (err) {
        if (String(err).indexOf(Errors.COULD_NOT_LOCK) === -1) {
          throw err
        }
      }

      await delay(TIME_BETWEEN_SPINS)
    }

    throw new Error(Errors.TIMEOUT)
  }

  /**
   * Obtains a lock for reading.
   */
  async RLock(options?: LockOptions) {
    return this.spinAndLock(() => this.tryRLock(), options)
  }

  /**
   * Obtains a lock for writing.
   */
  async WLock(options?: LockOptions) {
    const writerId = uuid()
    return this.spinAndLock(attempts => this.tryWLock(writerId, attempts), options)
  }
}
