/**
 * @file src/timeout/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export interface TimeoutOptions {
  timeout: number
}

export type TimeoutOptionsGiven = Partial<TimeoutOptions>

export const DefaultTimeoutOptions: TimeoutOptions = {
  timeout: 1000
}

export function defaults(options?: TimeoutOptionsGiven): TimeoutOptions {
  const config: TimeoutOptions = DefaultTimeoutOptions

  if (options) {
    if (options.timeout !== undefined) {
      if (
        typeof options.timeout !== 'number' ||
        options.timeout < 0
      ) {
        throw new Error(`Invalid value given for timeout: ${options.timeout}`)
      }

      config.timeout = options.timeout
    } else {
      throw new Error('No timeout option provided! It is required.')
    }
  }

  return config
}
