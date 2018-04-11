# Fallbacks

Fallbacks are components that allow you to provide a way to specify a path of alternative business logic to be traversed if the primary path fails.

In simple terms, it allows your application to specify a result known as a **fallback** to be returned in the event that an action fails.

## API

All `.from...()` methods on the Fallback component will create a fallback function that behaves the same as your original function but with a fallback behavior.

Available methods:

 - `fromAsync(fn, fallbackFn)`

## Examples

#### 404!

Let's try to serve a page from the disk and default to the 404 page:

```javascript
import { Fallback } from 'rsxjs'
import { readFile } from 'mz/fs'
import { readFileSync } from 'fs'

const NOT_FOUND = fs.readFileSync('/var/www/404.html')

const getPage = Fallback.fromAsync(
  // primary route
  page => readFile(`/var/www/${page}`),

  // fallback route
  page => NOT_FOUND
)

app.use(async (req, res) => {
  // it is now impossible for this to fail, since it has a 
  // default path to follow on failure
  res.end( await getPage(req.path) )
})
```
