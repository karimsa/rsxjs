# Deferral

Deferral components allow your function to specify cleanup operations that must be run once your function is completed. These cleanup operations will be executed whether the function completes or errors out.

## Example

### Closing a file

```javascript
import { Deferral } from 'rsxjs'
import { open, close } from 'mz/fs'

// this function will do make sure the file is closed
// even if it errors out
const doStuff = Deferral.fromAsync(async function (defer, file) {
  const fd = open(file)
  defer(() => close(fd))

  // do things with the file
  // or just die, whatever
  throw new Error('DIE!')
})
```
