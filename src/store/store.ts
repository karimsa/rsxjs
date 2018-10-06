/**
 * @file src/store/store.ts
 * @description Store interface.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export interface SetOptions {
  /**
   * If true, will only set if the key is not already present.
   */
  notExists?: boolean

  /**
   * If given, will expire the key after this time.
   */
  expires?: number
}

export interface Store {
  /**
   * Increment a stored value atomically.
   * @param key key to increment
   */
  incr(key: string): Promise<void>

  /**
   * Decrement a stored value atomically.
   * @param key key to decrement
   */
  decr(key: string): Promise<void>

  /**
   * Stores a given value at a given key.
   * @param key key to store value at
   * @param value the value to store
   * @returns {Promise<void>} resolves once key is stored
   */
  set<T>(key: string, value: T, options?: SetOptions): Promise<void>

  /**
   * Reads a value from the store.
   * @param key key to retreive from
   * @returns {Promise<T>} resolve to the value from the store, or rejects
   */
  get<T>(key: string): Promise<T | void>

  /**
   * Reads a value from the store.
   * @param key key to retreive from
   * @param defaultValue value to return if store doesn't have the key
   * @returns {Promise<T>} resolve to the value from the store, or rejects
   */
  get<T>(key: string, defaultValue: T): Promise<T>

  /**
   * Stores a given value at a given key within a given hashmap.
   * @param namespace name of the hashmap to store within
   * @param key key to store value at
   * @param value the value to store
   * @returns {Promise<void>} resolves once key is stored
   */
  hset<T>(namespace: string, key: string, value: T, options?: SetOptions): Promise<void>

  /**
   * Reads a value from a hashmap in the store.
   * @param namespace name of the hashmap to retrieve from
   * @param key key to retreive from
   * @returns {Promise<T>} resolve to the value from the store, or rejects
   */
  hget<T>(namespace: string, key: string): Promise<T | void>

  /**
   * Reads a value from a hashmap in the store.
   * @param namespace name of the hashmap to retrieve from
   * @param key key to retreive from
   * @param defaultValue value to return if store doesn't have the key
   * @returns {Promise<T>} resolve to the value from the store, or rejects
   */
  hget<T>(namespace: string, key: string, defaultValue: T): Promise<T>

  /**
   * Increment a stored value atomically within a hashmap.
   * @param key key to increment
   */
  hincr(namespace: string, key: string): Promise<void>

  /**
   * Decrement a stored value atomically within a hashmap.
   * @param key key to decrement
   */
  hdecr(namespace: string, key: string): Promise<void>

  /**
   * Removes a value from the store.
   * @param key key to delete
   * @returns {Promise<void>} resolves after delete
   */
  del(key: string): Promise<void>
}
