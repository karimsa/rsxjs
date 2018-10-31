/**
 * @file src/store/memory.ts
 * @description Memory store.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Store, SetOptions } from './store'

// use a universal map to stay consistent with distributed
// maps like redis
let map: Map<string, any>

interface LinkedNode<T> {
  value: T
  next?: LinkedNode<T>
  prev?: LinkedNode<T>
}

interface LinkedList<T> {
  head?: LinkedNode<T>
  tail?: LinkedNode<T>
}

export class MemoryStore implements Store {
  private readonly map: Map<string, any>

  constructor() {
    this.map = map = map || new Map()
  }

  async incr(key: string): Promise<number> {
    this.map.set(key, (this.map.get(key)|0) + 1)
    return this.map.get(key)
  }

  async decr(key: string): Promise<number> {
    this.map.set(key, (this.map.get(key)|0) - 1)
    return this.map.get(key)
  }

  async get<T>(key: string): Promise<T | void> {
    return this.map.get(key)
  }

  async set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    if (options) {
      if (options.notExists && this.map.has(key)) {
        return
      }

      if (options.expires !== undefined) {
        setTimeout(() => this.map.delete(key), options.expires)
      }
    }

    this.map.set(key, value)
  }

  async del(key: string): Promise<void> {
    this.map.delete(key)
  }

  async hget<T>(namespace: string, key: string): Promise<T | void>;
  async hget<T>(namespace: string, key: string, defaultValue: T): Promise<T>;

  async hget<T>(namespace: string, key: string, defaultValue?: T): Promise<T | void> {
    const map: Map<string, any> | void = this.map.get(namespace)
    if (!map) {
      return defaultValue
    }

    return map.get(key) || defaultValue
  }

  async hset<T>(namespace: string, key: string, value: T): Promise<void> {
    const map: Map<string, any> = this.map.get(namespace) || new Map<string, any>()
    this.map.set(namespace, map)
    map.set(key, value)
  }

  async hincr(namespace: string, key: string): Promise<number> {
    const ctr = 1 + (await this.hget(namespace, key, 0))
    this.hset(namespace, key, ctr)
    return ctr
  }

  async hdecr(namespace: string, key: string): Promise<number> {
    const ctr = -1 + (await this.hget(namespace, key, 0))
    await this.hset(namespace, key, ctr)
    return ctr
  }

  async rpush<T>(listName: string, value: T): Promise<void> {
    const node: LinkedNode<T> = {
      value,
    }
    const list: LinkedList<T> = this.map.get(listName)

    if (!list || !list.tail) {
      this.map.set(listName, {
        head: node,
        tail: node,
      })
      return
    }

    list.tail.next = node
    node.prev = list.tail
    list.tail = node
  }

  async lpush<T>(listName: string, value: T): Promise<void> {
    const node: LinkedNode<T> = {
      value,
    }
    const list: LinkedList<T> = this.map.get(listName)

    if (!list || !list.head) {
      this.map.set(listName, {
        head: node,
        tail: node,
      })
      return
    }

    node.next = list.head
    list.head.prev = node
    list.head = node
  }

  async rpop<T>(listName: string): Promise<T | void> {
    const list: LinkedList<T> = this.map.get(listName)
    if (!list || !list.tail) {
      return
    }

    const node = list.tail
    list.tail = node.prev
    return node.value
  }

  async lpop<T>(listName: string): Promise<T | void> {
    const list: LinkedList<T> = this.map.get(listName)
    if (!list || !list.head) {
      return
    }

    const node = list.head
    list.head = node.next
    return node.value
  }
}
