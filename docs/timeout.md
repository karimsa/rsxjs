# Timeout

Timeouts are one of the simplest components utilized for failing fast. They allow you to specify the maximum amount of time that you are willing to wait before accepting failure from a component. This is useful at times when you are unable to specify timeouts at each layer of your network or if you are waiting on a slow resource that may not be absolutely necessary.

## API

Available methods:

 - `fromAsync(asyncFunction, [options])`

### Options

| Name      | Type         | Default      | Description                                   |
|-----------|--------------|--------------|-----------------------------------------------|
| timeout   | number       | none         | amount of time to wait before failing         |

## Examples

### Timeout if the network is slow!

```javascript
import { get } from 'axios'
import { Timeout } from 'rsxjs'

const getPage = Timeout.fromAsync(async function getPage() {
  return get('https://www.google.ca/slowPage')
}, {
  timeout: 1000, // number of ms to wait
})

// will fail after 1s of waiting
await getPage()
```
