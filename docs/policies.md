# Combining Policies!

The best part about rsxjs is that you can combine multiple resilience components together to create a robust resilience policy for your services. This is very useful as it allows you to specify very complex and distributed patterns of recovery without writing very much code at all.

*Note: most of these examples utilize the `flow` utility from [lodash](http://npmjs.org/lodash). It is not required that you use this, but it is certainly very useful. If you wish to only use this util but not the rest of lodash, you can checkout [lodash.flow](http://npmjs.org/lodash.flow).*

This document contains some useful combinations of policies that are fairly common in applications.

## Timeout + Locks

With the `failFast` option, you can ask a lock to simply error out if it is in a locked state. But sometimes, you may wish to wait a small period of time before accepting defeat. You can do this by combining a [timeout](timeout.md) component with either a [mutex](mutex.md) or a [semaphore](semaphore.md).

```javascript
import { flow } from 'lodash'
import { Timeout, Mutex } from 'rsxjs'

async function doSexyOperation() {
  // TODO: do something on a shared resource
}

export const sexyOperation = flow(
  // by default, a mutex will not fail fast - it will wait
  // for its chance to obtain the lock
  Mutex.factory(),

  // the timeout component allows you to specify the time after
  // which you can fail the operation even if a lock is not obtained
  // in this case, we wait 1 second
  Timeout.factory({ timeout: 1000 }),
)( doSexyOperation )
```
