# Semaphore

Semaphores are another type of locking mechanism that allow locking of shared resources similar to the way that a [mutex](mutex.md) operates. However, instead of operating using a binary state, semaphores have a n-ary state through the use of "tokens". When the application wishes to use a shared resource, it must obtain a token from the semaphore. Once the semaphore has given out all of its token, it enters a locked state where all new requests must wait for an existing token to be released back into the semaphore.

This allows for **sychronizing the usage of a set of resources** as opposed to a single resource. For instance, you can treat the number of threads in an application as a finite set of resources (i.e. you do not want to allocate more than `n - 1` threads where `n` is the number of cores on your CPU). In this case, you may choose to use a semaphore of size `n - 1` are require that any workers using your threads must obtain a token from the semaphore before operating on a thread.

## API

Similar to mutexes, a semaphore token cannot be obtained synchronously.

Available methods:

 - `fromAsync(asyncFunction, [options])`

### Options

| Name      | Type         | Default      | Description                                   |
|-----------|--------------|--------------|-----------------------------------------------|
| failFast  | boolean      | true         | if true, will error out when attempting to obtain lock if lock already exists as opposed to waiting for lock to be available |

### Where's my raw semaphore???

See [mutex](mutex.md) for an explaination.

## Examples

### Controlled concurrency

```javascript
import { Semaphore } from 'rsxjs'

const doWork = Semaphore.fromAsync(4, async (work) => {
  // TODO: do work with 'work'
})

// we can queue up as much work as we would like, but it will only
// happen in batches of 4 since that is the size of our semaphore
const queue = []
for (let i = 0; i < 1e2; ++i) {
  queue.push(doWork())
}

await Promise.all(queue)
```
