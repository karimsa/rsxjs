/**
 * @file tests/channel/test-select.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

const { test } = require('ava')

const { makeChan, select } = require('../../')

test('blocking select', async t => {
  const chanA = makeChan({
    bufferSize: 2,
  })
  const chanB = makeChan({
    bufferSize: 2,
  })

  setTimeout(() => chanB.put('test'), 0)

  const ret = await select({
    [chanA]: a => ({ a }),
    [chanB]: b => ({ b }),
  })

  t.deepEqual(ret, { b: 'test' })
})

test('non-blocking select', async t => {
  const chanA = makeChan({
    bufferSize: 2,
  })
  const chanB = makeChan({
    bufferSize: 2,
  })

  // a select with a default case should be synchronous
  t.deepEqual(select({
    [chanA]: a => ({ a }),
    [chanB]: b => ({ b }),
    _: () => 'nothing',
  }), 'nothing')

  // write to buffer
  await chanA.put('stuff')
  t.deepEqual(select({
    [chanA]: a => ({ a }),
    [chanB]: b => ({ b }),
    _: () => 'nothing',
  }), { a: 'stuff' })

  // back to nothing
  t.deepEqual(select({
    [chanA]: a => ({ a }),
    [chanB]: b => ({ b }),
    _: () => 'nothing',
  }), 'nothing')

  // now from b
  await chanB.put('stuff')
  t.deepEqual(select({
    [chanA]: a => ({ a }),
    [chanB]: b => ({ b }),
    _: () => 'nothing',
  }), { b: 'stuff' })

  // back to nothing
  t.deepEqual(select({
    [chanA]: a => ({ a }),
    [chanB]: b => ({ b }),
    _: () => 'nothing',
  }), 'nothing')

  // from both
  await chanA.put('stuff')
  await chanB.put('stuff')

  // read from a
  t.deepEqual(select({
    [chanA]: a => ({ a }),
    [chanB]: b => ({ b }),
    _: () => 'nothing',
  }), { a: 'stuff' })

  // fail a, read b
  t.deepEqual(select({
    [chanA]: a => ({ a }),
    [chanB]: b => ({ b }),
    _: () => 'nothing',
  }), { b: 'stuff' })

  // back to nothing
  t.deepEqual(select({
    [chanA]: a => ({ a }),
    [chanB]: b => ({ b }),
    _: () => 'nothing',
  }), 'nothing')
})
