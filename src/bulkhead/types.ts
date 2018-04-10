/**
 * @file src/bulkhead/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export interface BulkheadOptions {
  // ...
}

export type BulkheadOptionsGiven = Partial<BulkheadOptions>

export const DefaultBulkheadOptions: BulkheadOptions = {
}

export function defaults(_?: BulkheadOptionsGiven): BulkheadOptions {
  const config: BulkheadOptions = DefaultBulkheadOptions

  // ...

  return config
}
