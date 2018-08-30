# Channels

Channels (based on golang's channel concept) are a data structure that allow for
synchronized communication. The concept is very similar to the idea of a javascript
stream but with easier to use backpressure support. To learn more about the actual
concept of a channel, I recommend checking out [Effective Go](https://golang.org/doc/effective_go.html#channels) and also
[Async Iterators vs. Communicating Sequential Processes](http://2ality.com/2017/03/csp-vs-async-generators.html).

 - [API](#api)
 - [Reading vs. Writing](#reading-vs-writing)
 - [The Cool Stuff](#the-cool-stuff)
 - [Prior Art](#prior-art)

### API

#### `makeChan([options])`

 - **options** (object; optional):
    - **bufferSize** (positive integer or zero): the size of the internal buffer to use

Returns an instance of `Channel<T>` ready to use.

*Note: The `Channel` class is not exported to avoid the direct use of the channel
constructor when writing in TypeScript. To enable the fancy `select()` API, the
instances of `Channel` also behave as symbols - which requires a union between
the class type and `symbol`. rsxjs does the type join for you when using `makeChan()`
while simply proxying the channel constructor in a type safe way.*

#### `Channel.prototype.put(value: T, timeout?: number): Promise<{ ok: boolean }>`

 - **value** (T): value to push into the channel.
 - **timeout** (optional number): if provided, waits for a maximum of this amount of ms
 before exiting with `ok` as `false`.

Returns a promise that resolves to an object with a single key - `ok` which will be
`true` if the value was successfully written to the channel or buffer. If the operation
times out, `ok` will be `false` but it will not throw an error.

Throws an error if the channel is already closed.

#### `Channel.prototype.take(timeout?: number): Promise<{ ok: boolean, value?: T }>`

 - **timeout** (optional number): if provided, waits for a maximum of this amount of ms
 before exiting with `ok` as `false`.

Returns a promise that resolves to the next value as `value` and whether or not the operation
was successful using `ok` in the channel.

Will throw an error if the channel is closed and there is nothing left in the buffer.

#### `Channel.prototype.select(): { ok: boolean, value?: T }`

Synchronously checks a channel for a value. If available, will return with the value and
`ok = true`. If no value is waiting, the channel will return with `ok = false` and no
value.

#### `Channel.prototype.close(): void`

Synchronously closes the channel. After this point, you cannot write values to the channel.
Reading is still possible until all values are read off.

## Reading vs. Writing

To ensure type safety, you may wish to pass read-only or write-only copies of your channel
down to the processes that are using your channel. You can do this with a purely compile-time
type cast if you are using TypeScript or you can use the built-in wrappers if you are using
JavaScript. Here's some examples.

### Creating a ReadOnly Channel with TS

```typescript
import { makeChan, ReadOnlyChannel } from 'rsxjs'

async function chanReader(chan: ReadOnlyChannel<number>): Promise<void> {
  // this function will only be able to 
}
```

## The Cool Stuff

Once you create a channel, you can do the usual `put()` and `take()` to read/write values.
rsxjs channels also support a `range()`-style API through the async iterator protocol. To
range over all possible values in a channel until it closes, you can do something like this:

```typescript
const names = makeChan<string>()

for await (const name of names) {
  console.log(`hello, ${name}`)
}
```

This loop will continue to run until someone calls `close()` on the channel + all values are
read off the channel.

Another cool thing that is borrowed from golang is the `select` statement. In order to express
"read from any of these channels", you can use select and specify the channels are indexes to
the object literal that you pass in:

```typescript
const values = makeChan<number>()
const quit = makeChan<void>()

// express cancelation logic
const { type, val } = await select({
  [values]: val => ({ type: 'value', val }),
  [quit]: () => ({ type: 'quit' }),
})

if (type === 'value') {
  // do something with the value
}
```

You can also do a blocking select which makes taking values from the selected channels optional.
If none of the channels are ready to receive from, it will hit the default case. To express the
default case, use the string `_` as the object index:

```typescript
const chanA = makeChan<string>()
const chanB = makeChan<number>()

// 'await' is not needed - a blocking select will return
// sychronously since it does not need to wait for anything
const { a, b, ok } = select({
  [chanA]: a => ({ a, ok: true }),
  [chanB]: b => ({ b, ok: true }),
  _: () => ({ ok: false }),
})

if (!ok) {
  // did not read from any channel
}
```

If you don't want to select off many channels and instead just a single channel, each
channel instance has a `.select()` method that makes the code a bit easier than using
an entire select statement:

```typescript
const values = makeChan<string>()

const { value, ok } = values.select()
if (!ok) {
  // no value read
}
```

## Prior Art

 - [asyncquence](https://github.com/getify/asyncquence)
 - [async-csp](https://github.com/dvlsg/async-csp)
