<h1 align="center">
  <img src=".github/logo.png" alt="RSX.JS">
</h1>

<p align="center">Resilience Extensions for JS.</p>

<p align="center">
  <a href="https://semaphoreci.com/karimsa/rsxjs">
    <img src="https://semaphoreci.com/api/v1/karimsa/rsxjs/branches/master/badge.svg" alt="Build Status">
  </a>

  <a href="https://codecov.io/gh/karimsa/rsxjs">
    <img src="https://codecov.io/gh/karimsa/rsxjs/branch/master/graph/badge.svg" alt="Coverage">
  </a>
</p>

**Table of Contents:**

 - [TL;DR](#tldr)
 - [Getting Started](#getting-started)
   - [Circuit Breakers](docs/breaker.md)
   - [Channels](docs/channel.md)
   - [Coroutines](docs/coroutine.md)
   - [Deferral](docs/deferral.md)
   - [Fallback](docs/fallback.md)
   - [Mutexes](docs/mutex.md)
   - [Pools](docs/pool.md)
   - [Semaphores](docs/semaphore.md)
   - [Timeout](docs/timeout.md)
   - [WaitGroup](docs/waitgroup.md)
 - [Combining Components](docs/policies.md)
 - [License and Attribution](#license-and-attribution)

## TL;DR

  1. Install it.

  [![NPM](https://nodei.co/npm/rsxjs.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/rsxjs/)

  2. Write your code as isolated components (should already be doing this).
  3. Wrap your components with resilience policies using [rsxjs components](#components).

## Getting Started

The goal of rsxjs is to make available a library of resilience components that are:

 1. **Low-level**: rsxjs tries to make available low-level components that are not precomposed into a resilience policy but rather available for the application developers to utilize in their designs the way that they choose. This allows rsxjs to stay away from creating opinions about how resilience should be handled and instead just provide a library that can be used to increase application resilience.
 2. **Incrementally adoptable**: we all know the pains of trying to maintain a legacy system - but your tooling choices should not be limited simply because your company's product roadmap does not allocate time for improving the quality of your codebase. With this in mind, rsxjs tries to ensure that its concepts require minimal effort to adopt and can be adopted at a per-component basis so that you can secretly hide it into your feature implementations rather than allocate time to convert a legacy codebase.
 3. **Distributed if stateful**: it's not enough for many of these components to simply main a local/offline state. For instance, when using locks or circuit breakers around your microservice or database driver, you would want all of your nodes in your system to synchronize the circuit breakers states and therefore avoid resource exhaustion in a more holistic fashion. Due to this, rsxjs provides a way to persist its components states onto redis in order to help synchronize distributed components - or you can use it locally without any extra setup.
 4. **Highly composable**: the biggest power of JavaScript comes from its composability - the way that highly complex systems can come together by building on top of each other. rsxjs tries to keep to JavaScript's fundamentals in order to maintain these concepts so that you actually end up adding resilience as a layer on top of your application instead of having to uproot any design.

### Observables?

Observables are another incredible resilience component and are very useful when trying to design a robust pipeline when you are streaming data. JavaScript already has an incredible library to offer support for observables known as [RxJS](https://npmjs.org/rxjs) - this is why rsxjs does not include observables. RxJS also provides similar functionality as rsxjs but strictly as transformations for streams. Though observables are very useful, you should be careful not to overuse them.

For instance, an observable might be useful in a UI component where a network request may result in multiple results (i.e. one from cache, another from the network). However, using an observable to persist the results of a submitted form on a backend does not make sense.

## License and Attribution

License under MIT license.

Copyright &copy; 2018-present Karim Alibhai. All rights reserved.

### Logo Attribution

"falling" by Laurent Canivet from the Noun Project.

"Trampoline" by Jonathan Lutaster from the Noun Project.

[The Noun Project](https://thenounproject.com) is amazing.
