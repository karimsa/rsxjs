/**
 * @file tests/channel/test-ro.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from 'ava'

import { makeChan } from '../../../'

function isReadable(t, c, shouldPass) {
  const method = shouldPass ? 'is' : 'not'
  t[method](typeof c.take, 'function', `channel should${shouldPass ? '' : ' not'} have a take() method`)
  t[method](typeof c.select, 'function', `channel should${shouldPass ? '' : ' not'} have a select() method`)
  t[method](typeof c[Symbol.asyncIterator], 'function', `channel should${shouldPass ? '' : ' not'} support async iterator protocol`)
}

function isWritable(t, c, shouldPass) {
  const method = shouldPass ? 'is' : 'not'
  t[method](typeof c.put, 'function', `channel should${shouldPass ? '' : ' not'} have a put() method`)
}

test('readonly & writeonly channels', async t => {
  const chan = makeChan()

  // default channel should be readwrite
  isReadable(t, chan, true)
  isWritable(t, chan, true)

  // test readOnly channel
  const ro = chan.readOnly()
  isReadable(t, ro, true)
  isWritable(t, ro, false)

  // test writeOnly channel
  const wo = chan.writeOnly()
  isReadable(t, wo, false)
  isWritable(t, wo, true)
})
