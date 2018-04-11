# Mutex

Mutexes are a type of locking mechanism that allow for concurrent processes to synchronize data amongst themselves by requiring themselves to obtain a lock before operating on shared resources.

Typically, this would happen at a thread-level where you can request a low-level thread lock on your thread so that operations are truly halted during the waiting period. However, even though JS does not have thread-access, the same concept carries over to concurrent/async tasks in JS. There are times when you need to operate on a shared resource and those operations should occurr in a locked state.

## API

It is not possible to obtain a mutex from rsxjs synchronously (since this would halt the event loop and therefore the mutex could never actually be released) so it will only ever be possible to wrap this component around async functions - but there are intentions to wrap this around a sync function which would result in an async function.

Available methods:

 - `fromAsync(asyncFunction, [options])`

### Options

| Name      | Type         | Default      | Description                                   |
|-----------|--------------|--------------|-----------------------------------------------|
| failFast  | boolean      | true         | if true, will error out when attempting to obtain lock if lock already exists as opposed to waiting for lock to be available |

### Where's my low-level Mutex???

The low-level Mutex class is not exposed outside of rsxjs to help avoid deadlock states. In particular, it is very easy to write your async function as a function that obtains a mutex, then fails, causing every other operation that uses the same mutex to halt forever.

To circumvent this possibility, rsxjs abstracts the low-level locking & unlocking away from the userland and just exposes an API to wrap async functions in a Mutex which automatically attempts to obtain a lock before calling its underlying function then releases the lock before returning / erroring out. For some designs, this might mean that you need to pull the logic in your code that operates in a locked state out of your main function and into a helper function and wrap the Mutex only around your helper. This would allow your logic to utilize Mutexes while only entering a locked state for the minimum amount of time required.

## Examples

### Operating on the same array

```javascript
import { Mutex } from 'rsxjs'

// creates a large amount of work
const work = []
for (let i = 0; i < 1e6; ++i) {
  work.push({ num: i })
}

const dequeue = Mutex.fromAsync(function dequeue(value) {
  return work.shift()
})

async function doWork() {
  let sum = 0

  while (true) {
    const job = await dequeue()

    if (job) {
      sum += job.num
    }
  }

  return sum
}

// in this situation, we have work that needs to be completed sitting
// in a queue which is shared between 4 concurrent workers. Without synchronization,
// we can easily end up in a case where two workers are working on the same piece of work
// at the same time.
// To avoid this, we can make sure that the 'dequeue' function - which operates on the shared
// resource, is wrapped in a Mutex component so that only one call to dequeue can run at a time.
// This will allow synchronization between the workers since they may run concurrently, but they
// must hand-off control of the queue between each other
await Promise.all([
  doWork(),
  doWork(),
  doWork(),
  doWork(),
]).then((_, sum) => {
  console.log('The sum is: %s', sum)
})
```
