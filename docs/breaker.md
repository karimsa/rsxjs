# Circuit Breakers

Circuit breakers are really useful for avoiding cascading failure by allowing
a resource some grace time to recover from an error before retrying the request.

This is done by splitting introducing a breaker in between the consumer of the
resource and the resource itself. Instead of requesting the resource directly,
the consumer makes a request to the circuit breaker.

The circuit breaker can be in one of the three states:

In an **open state**, the circuit breaker will simply pass through all requests to
the resource and simply keep track of failures. After its internal threshold is
hit, it will trip and move into a closed state.

In a **closed state**, the circuit breaker will error out with the same error to
every incoming request without accessing the underlying resource. This is the cool
off period during which the circuit breaker is useful.

A **half-open state** is hit by the circuit breaker every `N` units of time during
a closed state. This allows the circuit breaker to retry a single request to determine
whether it must remain closed or re-open itself.

## API

Any `from...()` methods on the breaker will create a circuit breaker that behaves
exactly the same as the implementation passed to the breaker. However, it will wrap
that with circuit breaker behavior. So if you pass an async function, you will get
an async functions back; if you pass a function that takes a callback (`fs.readFile`),
you will get a function that takes a callback back, etc.

 - `fromSync(fn, [options]) => fn`
 - `fromAsync(asyncFn, [options]) => asyncFn`
 - `fromCallback(cbFn, [options]) => cbFn`

### Options

| Name      | Type         | Default      | Description                                   |
|-----------|--------------|--------------|-----------------------------------------------|
| maxErrors | number (>=1) | 10           | maximum number of errors before tripping      |
| timeout   | 10s          | number (>=1) | time span between a closed and halfopen state |
