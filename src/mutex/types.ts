/**
 * @file src/mutex/types.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Store } from '../store'

export interface MutexOptions {
	name?: string
	failFast?: boolean
	timeout?: number
	store?: Store
}
