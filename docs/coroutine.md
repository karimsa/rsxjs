# Coroutine

rsxjs comes with a built-in coroutine runtime that can be used instead of
async/await when cancelation is required. It automatically wraps routines in
a [deferral](deferral.md) component & attaches a cancel method to the returned
promise.

**Notes**

 * No synchronous cancelations.
 * First argument is always a `defer()` function (see deferral docs).

**Synchronous Cancelation**

Coroutines cannot be cancelled synchronously since it would be a poor design to
immediately cancel a scheduled operation. Let's take this code as an example:

```javascript
import { co } from 'rsxjs'

const p = co(function* () {
  // start doing work
})

if (shouldNotHaveRun) {
  await p.cancel()
}

await p
```

This can easily be refactored to never schedule the operation in the first place:

```javascript
import { co } from 'rsxjs'

if (!shouldNotHaveRun) {
  await co(function* () {
    // start doing work
  })
}
```

As you can see, the second one is much cleaner & does not require extra logic from the
runtime to allow immediate cancelation.

## Usage

API is based on its cousin [co](https://npmjs.org/co).

 - `co(fn)`: executes fn on next tick.
 - `co.wrap(fn)`: wraps the function and provides an async function back.

## Examples

### Operating on a file

```javascript
import * as net from 'net'
import { Deferral, makeChan, range } from 'rsxjs'
import { open, close } from 'mz/fs'

const p = co(function* (defer) {
  const fd = yield open(file)
  defer(() => close(fd))

  const socks = makeChan({ bufferSize: 100 })
  const server = net.createServer(sock => socks.put(sock))

  // doesn't return a promise right now, but
  // you get the idea
  await server.listen(fd)
  defer(() => server.close())

  for await (const sock of range(socks)) {
    // do something with the sock
  }
})

// cancel it whenever
await p.cancel()

// p is a promise, you can await it or whatever
await p
```
