# Mutex

Mutexes are a type of locking mechanism that allow for concurrent processes to synchronize data amongst themselves by requiring themselves to obtain a lock before operating on shared resources.

Even though JS does not have thread-access, the same concept carries over to concurrent/async tasks in JS. It is not possible, nor required, to obtain a synchronous mutex in JS. Due to the design of the event loop, all sychronous code is automatically blocking on a single thread and is therefore not in danger of allowing parallel access to shared resources (the callstack + event loop act as a lock for you).

However, async functions in JS read synchronously but there are ticks in between each await which can result in the "parallel" accessing of a shared resource even though JS is not multi-threaded. The mutex component is built to wrap around the entire async function and therefore retain the lock during multiple event loop ticks.

## API

Available methods:

 - `fromAsync(asyncFunction, [options])`

### Options

| Name      | Type         | Default      | Description                                   |
|-----------|--------------|--------------|-----------------------------------------------|
| failFast  | boolean      | true         | if true, will error out when attempting to obtain lock if lock already exists as opposed to waiting for lock to be available |

### Where's my raw mutex???

The raw Mutex class is not exposed outside of rsxjs to help avoid deadlock states. In particular, it is very easy to write your async function as a function that obtains a mutex, then fails, causing every other operation that uses the same mutex to halt forever.

To circumvent this possibility, rsxjs abstracts the raw locking & unlocking away from the userland and just exposes an API to wrap async functions in a Mutex which automatically attempts to obtain a lock before calling its underlying function then releases the lock before returning / erroring out. For some designs, this might mean that you need to pull the logic in your code that operates in a locked state out of your main function and into a helper function and wrap the Mutex only around your helper. This would allow your logic to utilize Mutexes while only entering a locked state for the minimum amount of time required.

## Examples

### Operating on an async resource

```javascript
import { Mutex } from 'rsxjs'

const run = Mutex.fromAsync(async function() {
  // this operation is not atomic, since the ticks in between
  // your get and set might change the value of "key"
  if (await get('key') === expectedValue) {
    await set('key', newValue)
  }
})

// the event loop will alternate between these processes during
// ticks due to the awaits, but the mutex will force the second
// operation to wait until the first operation is fully complete
Promise.all([
  run(),
  run(),
])
```
