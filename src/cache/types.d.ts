/**
 * @file src/cache/types.d.ts
 * @description Cache type definitions.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export interface Cache {
  get<T>(key: string): Promise<{ value: void, ok: false } | { value: T, ok: true }>
  set<T extends object>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
}

export interface CacheOptions {
  type: 'concurrent'
}
