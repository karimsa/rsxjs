/**
 * @file src/store/store.ts
 * @description Store interface.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export interface Store {
  /**
   * Stores a given value at a given key.
   * @param key key to store value at
   * @param value the value to store
   * @returns {Promise<void>} resolves once key is stored
   */
  set<T>(key: string, value: T): Promise<void>

  /**
   * Stores the given value at the given key, if the key does not exist.
   * @param key key to store value at
   * @param value the value to store
   * @returns {Promise<boolean>} resolves to true if the key was empty and is now written
   */
  setnx<T>(key: string, value: T): Promise<boolean>

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
