/**
 * @file src/mutex/lock.ts
 * @description Raw mutex access.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { Mutex } from './mutex'
import { MutexOptions } from './types'

export async function lock(options: MutexOptions & { name: string }) {
  return {
    unlock: await (new Mutex(options)).lock(),
  }
}
