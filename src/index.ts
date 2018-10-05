/**
 * @file src/index.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import * as Breaker from './breaker'
import * as Mutex from './mutex'
import * as Pool from './pool'
import * as Semaphore from './semaphore'
import * as Timeout from './timeout'
import * as Fallback from './fallback'
import * as Deferral from './deferral'
import * as Cache from './cache'

export {
  WaitGroup,
} from './waitgroup'

export {
  chan,
  select,
  makeChan,
  readOnlyChan,
  writeOnlyChan,
} from './channel'

export {
  co,
} from './coroutine'

export {
  Store,
  RedisStore,
  MemoryStore,
} from './store'

export {
  Breaker,
  Mutex,
  Pool,
  Semaphore,
  Timeout,
  Fallback,
  Deferral,
  Cache,
}


// for unit testing/debugging
import * as utils from './utils'
import { ConcurrentCache } from './cache/concurrent'
if (process.env.NODE_ENV === 'test') {
  Object.assign(exports, {
    ...utils,
    ConcurrentCache,
  })
}
