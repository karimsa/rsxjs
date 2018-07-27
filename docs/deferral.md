# Deferral

Deferral components allow your function to specify cleanup operations that must be run once your function is completed. These cleanup operations will be executed whether the function completes or errors out.

## Usage

You can wrap your function with a deferral using `Deferral.fromAsync()`. The first argument to your
function will be the `defer()` function which allows you to pass callbacks to execute for cleanup.

### Notes on Deferrals

 * Will be executed in reverse order.
 * If one errors out, the rest will not be executed.
 * If it returns a promise, the deferral will wait for the promise to resolve before exiting your
 function.
 * Other than promises, all return values from deferred functions are ignored.

## Example

### Closing a file

```javascript
import { Deferral } from 'rsxjs'
import { open, close } from 'mz/fs'

// this function will do make sure the file is closed
// even if it errors out
const doStuff = Deferral.fromAsync(async function (defer, file) {
  const fd = await open(file)
  defer(() => close(fd))

  // do things with the file or just die, whatever
  throw new Error('DIE!')
})
```
