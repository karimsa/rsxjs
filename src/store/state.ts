/**
 * @file src/store/state.ts
 * @description Type-safe wrapper over stores.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Store } from './store'

export class State<T extends { [key: string]: any }> {
  private readonly store: Store
  private readonly namespace: string
  private readonly defaults: T

  constructor({ store, namespace, defaults }: {
    store: Store
    namespace: string
    defaults: T
  }) {
    this.store = store
    this.namespace = namespace
    this.defaults = defaults
  }

  get<K extends keyof T, V extends T[K]>(key: K): Promise<V> {
    return this.store.hget(this.namespace, key as string, this.defaults[key])
  }

  set<K extends keyof T, V extends T[K]>(key: K, value: V): Promise<void> {
    return this.store.hset(this.namespace, key as string, value)
  }

  incr<K extends keyof T>(key: K): Promise<void> {
    return this.store.hincr(this.namespace, key as string)
  }

  decr<K extends keyof T>(key: K): Promise<void> {
    return this.store.hdecr(this.namespace, key as string)
  }

  reset() {
    return this.store.del(this.namespace)
  }

  async dump(): Promise<T> {
    const state = {} as T
    for (const key of Object.keys(this.defaults)) {
      state[key] = await this.get(key)
    }
    return state
  }
}
