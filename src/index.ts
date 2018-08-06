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
  Breaker,
  Mutex,
  Pool,
  Semaphore,
  Timeout,
  Fallback,
  Deferral,
}

// for unit testing
import * as utils from './utils'
if (process.env.NODE_ENV === 'test') {
  Object.assign(exports, {
    ...utils,
  })
}
