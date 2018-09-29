/**
 * @file src/store/store.ts
 * @description Store interface.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export interface Store {
  set(key: string, value: string): Promise<void>
  get(key: string): Promise<string>
  del(key: string): Promise<void>
}
