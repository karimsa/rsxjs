/**
 * @file src/deferral/from-generator.ts
 * @description Just another API for coroutines.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { co } from '../coroutine'
import { AsyncFunction } from '../types'

export function fromGenerator<T>(fn: GeneratorFunction): AsyncFunction<T> {
	return co.wrap<T>(fn)
}
