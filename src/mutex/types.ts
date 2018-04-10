/**
 * @file src/mutex/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export interface MutexOptions {
  failFast: boolean
}

export type MutexOptionsGiven = Partial<MutexOptions>

const DefaultMutexOptions: MutexOptions = {
  failFast: false,
}

export function defaults(options?: MutexOptionsGiven): MutexOptions {
  const config: MutexOptions = DefaultMutexOptions

  if (options) {
    if (options.failFast !== undefined) {
      config.failFast = !! options.failFast
    }
  }

  return config
}
