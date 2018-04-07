/**
 * @file src/bulkhead/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export interface BulkheadOptions {
  /**
   * If true, the bulkhead will fail requests for work
   * when the underlying semaphore is locked rather than
   * awaiting an unlocked state.
   */
  failFast: boolean
}

export type BulkheadOptionsGiven = Partial<BulkheadOptions>

export const DefaultBulkheadOptions: BulkheadOptions = {
  failFast: false
}

export function defaults(options?: BulkheadOptionsGiven): BulkheadOptions {
  const config: BulkheadOptions = DefaultBulkheadOptions

  if (options) {
    if (options.failFast !== undefined) {
      config.failFast = options.failFast
    }
  }

  return config
}
