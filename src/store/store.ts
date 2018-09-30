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
  get<T>(key: string): Promise<T>
  
  /**
   * Removes a value from the store.
   * @param key key to delete
   * @returns {Promise<void>} resolves after delete
   */
  del(key: string): Promise<void>
}
