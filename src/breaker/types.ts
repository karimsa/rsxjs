/**
 * @file src/breaker/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export interface BreakerOptions {
  maxErrors: number
  timeout: number
}

export type BreakerOptionsGiven = Partial<BreakerOptions>

export function defaults(config?: BreakerOptionsGiven): BreakerOptions {
  const updatedConfig: BreakerOptions = Object.assign({}, DefaultBreakerOptions)

  if (!config) {
    return updatedConfig
  }

  if (config.maxErrors !== undefined) {
    const { maxErrors } = config

    if (
      typeof maxErrors !== 'number' ||
      maxErrors < -1 ||
      !isFinite(maxErrors) ||
      isNaN(maxErrors)
    ) {
      throw new TypeError(`Unexpected value of type ${typeof maxErrors} given to 'maxErrors'`)
    }

    updatedConfig.maxErrors = maxErrors
  }

  if (config.timeout !== undefined) {
    const { timeout } = config

    if (
      typeof timeout !== 'number' ||
      timeout < -1 ||
      !isFinite(timeout) ||
      isNaN(timeout)
    ) {
      throw new TypeError(`Unexpected value of type ${typeof timeout} given to 'timeout'`)
    }

    updatedConfig.timeout = timeout
  }

  return updatedConfig
}

export const DefaultBreakerOptions: BreakerOptions = {
  maxErrors: 10,
  timeout: 10 * 1000
}

export interface BreakerStateObject {
  numErrors: number
  lastError: Error | undefined
  lastErrorTime: number
}

export const enum BreakerState {
  OPEN,
  CLOSED,
  HALFOPEN,
}

export function getBreakerState(
  state: BreakerStateObject,
  config: BreakerOptions
): BreakerState {
  if ( state.numErrors >= config.maxErrors ) {
    const elapsed = Date.now() - state.lastErrorTime

    if ( elapsed >= config.timeout ) {
      return BreakerState.HALFOPEN
    }

    return BreakerState.CLOSED
  }

  return BreakerState.OPEN
}
