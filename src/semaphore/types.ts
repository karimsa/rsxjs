/**
 * @file src/semaphore/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export interface SemaphoreOptions {
  size: number
  failFast: boolean
}

export type SemaphoreOptionsGiven = Partial<SemaphoreOptions>

const DefaultSemaphoreOptions: SemaphoreOptions = {
  size: 0,
  failFast: false,
}

export function defaults(options?: SemaphoreOptionsGiven): SemaphoreOptions {
  const config: SemaphoreOptions = DefaultSemaphoreOptions

  if (options) {
    if (options.failFast !== undefined) {
      config.failFast = !! options.failFast
    }

    if (options.size !== undefined) {
      config.size = options.size
    }
  }

  if (typeof config.size !== 'number' || config.size < 1 || Math.round(config.size) !== config.size) {
    throw new Error(`Invalid size given for semaphore: ${config.size}`)
  }

  return config
}
