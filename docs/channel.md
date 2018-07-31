# Channels

Channels (based on golang's channel concept) are a data structure that allow for
synchronized communication. The concept is very similar to the idea of a javascript
stream but with easier to use backpressure support. To learn more about the actual
concept of a channel, I recommend checking out [Effective Go](https://golang.org/doc/effective_go.html#channels) and also
[Async Iterators vs. Communicating Sequential Processes](http://2ality.com/2017/03/csp-vs-async-generators.html).

 - [API](#api)
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

#### `Channel.prototype.put(value: T): Promise<void>`

 - **value** (T): value to push into the channel.

Returns a promise that resolves successfully once successfully written to the channel
or buffer.
Throws an error if the channel is already closed.

#### `Channel.prototype.take(timeout?: number): Promise<T>`

 - **timeout** (optional number): if provided, wraps the underlying take operation with
 a cancelable timeout. If the timeout surpasses, the `take()` will throw an error. This
 will not cause the discarding of an underlying value should it be later made available
 since the operation is canceled.

Returns a promise that resolves to the next value in the channel.

#### `Channel.prototype.select(): { ok: boolean, value?: T }`

Synchronously checks a channel for a value. If available, will return with the value and
`ok = true`. If no value is waiting, the channel will return with `ok = false` and no
value.

#### `Channel.prototype.close(): void`

Synchronously closes the channel. After this point, you cannot write values to the channel.
Reading is still possible until all values are read off.

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
