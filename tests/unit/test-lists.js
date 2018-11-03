/**
 * @file tests/unit/test-lists.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import test from 'ava'
import { v4 as uuid } from 'uuid'

import { MemoryStore } from '../../'

test('should be able to act as a queue (LTR)', async t => {
  const store = new MemoryStore()
  const listName = `testList:${uuid()}`

  await store.lpush(listName, 'a')
  await store.lpush(listName, 'b')
  await store.lpush(listName, 'c')
  await store.lpush(listName, 'd')

  t.is(await store.rpop(listName), 'a')
  t.is(await store.rpop(listName), 'b')
  t.is(await store.rpop(listName), 'c')
  t.is(await store.rpop(listName), 'd')

  await store.del(listName)
})

test('should be able to act as a queue (RTL)', async t => {
  const store = new MemoryStore()
  const listName = `testList:${uuid()}`
  
  await store.rpush(listName, 'a')
  await store.rpush(listName, 'b')
  await store.rpush(listName, 'c')
  await store.rpush(listName, 'd')

  t.is(await store.lpop(listName), 'a')
  t.is(await store.lpop(listName), 'b')
  t.is(await store.lpop(listName), 'c')
  t.is(await store.lpop(listName), 'd')

  await store.del(listName)
})

test('should be able to act as a stack (LTL)', async t => {
  const store = new MemoryStore()
  const listName = `testList:${uuid()}`
  
  await store.lpush(listName, 'a')
  await store.lpush(listName, 'b')
  await store.lpush(listName, 'c')
  await store.lpush(listName, 'd')

  t.is(await store.lpop(listName), 'd')
  t.is(await store.lpop(listName), 'c')
  t.is(await store.lpop(listName), 'b')
  t.is(await store.lpop(listName), 'a')

  await store.del(listName)
})

test('should be able to act as a stack (RTR)', async t => {
  const store = new MemoryStore()
  const listName = `testList:${uuid()}`
  
  await store.rpush(listName, 'a')
  await store.rpush(listName, 'b')
  await store.rpush(listName, 'c')
  await store.rpush(listName, 'd')

  t.is(await store.rpop(listName), 'd')
  t.is(await store.rpop(listName), 'c')
  t.is(await store.rpop(listName), 'b')
  t.is(await store.rpop(listName), 'a')

  await store.del(listName)
})
