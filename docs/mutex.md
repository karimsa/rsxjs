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

<!-- TODO: I'd like to improve this example -->

```javascript
import { Mutex } from 'rsxjs'

const work = []

const enqueue = Mutex.fromAsync(function enqueue(value) {
  work.push(value)
})

const dequeue = Mutex.fromAsync(function dequeue(value) {
  return work.shift()
})

async function createWork() {
  for (let i = 0; i < 1e6; ++i) {
    await enqueue({ num: i })
  }
}

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

// createWork() and doWork() will run concurrently and operate
// on the same array, but neither will interfere with the others'
// operations on the array - since an `enqueue()` and a `dequeue()`
// cannot happen at the same time
await Promise.all([
  createWork(),
  doWork()
]).then((_, sum) => {
  console.log('The sum is: %s', sum)
})
```

*Hint: you can utilize pooling in this example for some extra efficiency.*
