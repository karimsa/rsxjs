/**
 * @file src/pool/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { LinkedNode } from '../types'

export interface PoolOptions {
  // ...
}

export type PoolOptionsGiven = Partial<PoolOptions>

export function defaults(
  _?: PoolOptionsGiven
): PoolOptions {
  const config: PoolOptions = {
    // ...
  }

  // ...

  return config
}

export interface Worker {
  isAvailable(): boolean
}

export function isWorkerAvailable<T extends Worker>(worker: T): boolean {
  return (
    worker &&
    typeof worker.isAvailable === 'function' &&
    worker.isAvailable()
  )
}

export class GenericPool<T extends Worker> {
  private head?: LinkedNode<T>
  private tail?: LinkedNode<T>

  addWorker(worker: T): void {
    if (!isWorkerAvailable(worker)) {
      throw new Error(`Worker was given, but is not available.`)
    }

    if (!this.tail) {
      this.head = this.tail = {
        value: worker,
      }

      return
    }

    const node: LinkedNode<T> = {
      prev: this.tail,
      value: worker,
    }
    this.tail.next = node
    this.tail = node
  }

  getExistingWorker(): T | void {
    for (let node: LinkedNode<T> | void = this.head; node; node = node.next) {
      if (isWorkerAvailable(node.value)) {
        return node.value
      }
    }
  }
}

export class SyncPool<T extends Worker> extends GenericPool<T> {
  constructor(
    public readonly it: Iterator<T>,
    public readonly options: PoolOptions
  ) {
    super()
  }

  getWorker(): T {
    const worker = this.getExistingWorker()
    if (worker) return worker

    const result = this.it.next()

    if (result.done) {
      throw new Error('Pool has died - iterator is out of results')
    }

    this.addWorker(result.value)
    return result.value
  }
}

export class AsyncPool<T extends Worker> extends GenericPool<T> {
  constructor(
    public readonly it: AsyncIterator<T>,
    public readonly options: PoolOptions
  ) {
    super()
  }

  async getWorker(): Promise<T> {
    const worker = this.getExistingWorker()
    if (worker) return worker

    const result = await this.it.next()

    if (result.done) {
      throw new Error('Pool has died - iterator is out of results')
    }

    this.addWorker(result.value)
    return result.value
  }
}

export type Pool<T extends Worker> = SyncPool<T> | AsyncPool<T>
