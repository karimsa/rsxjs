# Pools

Let's say that you have a set of resources that need to accomplish some amount of work. You need to effectively distribute your work amongst these resources such that (a) all of your work gets done, regardless of failures in a resource and (b) your resources are not exhausted at any point.

This is where pooling comes in! The idea behind pooling is that you can treat your resources as a pool of resources instead of as static resources. This means that when works needs to be done, you simply pick an object from the pool and then operate on it, returning it into the pool when done.

There are different approaches to pooling which are known as **strategies** within rsxjs. By specifying a strategy, you can ask rsxjs to operate your pool using a certain algorithm for both resource allocation and work distribution.

## API

## Options

## Strategies

## Examples
