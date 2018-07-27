# WaitGroup

WaitGroups are a beautiful & very simple construct for waiting for concurrent operations to complete. The JS core library comes with some built in helpers for this when using promises but the APIs still require much boilerplate to get started.

For instance, let's say we want to launch an operation several times in a loop and the function always returns a promise for us to listen on. In order to wait for all operations to end, the default code would look something like this:

```javascript
const goals = []

for (...) {
  goals.push(callOp())
}

await Promise.all(goals)
```

The equivalent code using a WaitGroup would be very similar:

```javascript
const wg = new WaitGroup()

for (...) {
  wg.add(callOp())
}

await wg.wait()
```

However, let's make our case more complex. Let's say that each of these operations schedules other operations and your higher level loop needs to wait till all sub operations are completed as well. With the simple `Promise.all()`, you would need to repeat this awaiting logic at each stage of your orchestration.

Instead, you can pass the same waitgroup forward everywhere and have a single wait in your code.

```javascript
const wg = new WaitGroup()

for (...) {
  wg.add(callOp(wg))
}

// this will wait for operations to complete recursively, so all operations scheduled after the wait is called will also be waited upon
await wg.wait()
```

## Examples

### With simple counts

```javascript
import { WaitGroup } from 'rsxjs'

const wg = new WaitGroup()

for (let i = 0; i < 10; ++i) {
  wg.add()
  setTimeout(() => wg.done(), 10)
}

await wg.wait()
```

### With promises

```javascript
import { WaitGroup } from 'rsxjs'

const wg = new WaitGroup()

for (let i = 0; i < 10; ++i) {
  wg.add(get('/api'))
}

await wg.wait()
```

## With promises + timeout

```javascript
import { WaitGroup } from 'rsxjs'

const wg = new WaitGroup()

for (let i = 0; i < 10; ++i) {
  wg.add(get('/api'))
}

// if all 10 requests don't finish within the 1000ms, it'll throw
await wg.wait(1000)
```
