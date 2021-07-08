/**
 * @file src/semaphore/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Store, MemoryStore } from '../store'

export interface SemaphoreOptions {
	size: number
	failFast: boolean
	name?: string
	store: Store
}

export type SemaphoreOptionsGiven = Partial<SemaphoreOptions>

const DefaultSemaphoreOptions: SemaphoreOptions = {
	size: 0,
	failFast: false,
	store: new MemoryStore(),
}

export function defaults(options?: SemaphoreOptionsGiven): SemaphoreOptions {
	const config: SemaphoreOptions = DefaultSemaphoreOptions

	if (options) {
		if (options.failFast !== undefined) {
			config.failFast = !!options.failFast
		}

		if (options.size !== undefined) {
			config.size = options.size
		}

		if (options.store) {
			config.store = options.store
		}

		if (options.name) {
			config.name = options.name
		}
	}

	if (
		typeof config.size !== 'number' ||
		config.size < 1 ||
		Math.round(config.size) !== config.size
	) {
		throw new Error(`Invalid size given for semaphore: ${config.size}`)
	}

	return config
}
