/**
 * @file tests/dts/channel/ro-rw.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { makeChan, ReadOnlyChannel, WriteOnlyChannel } from '../../../'

async function testReadOnly(readChan: ReadOnlyChannel<number>): Promise<void> {
  // $ExpectError
  readChan.put(0)
  
  // $ExpectType Promise<{ ok: boolean, value?: number }>
  readChan.take()

  // $ExpectType { ok: boolean, value?: number }
  readChan.select()

  // $ExpectError
  readChan.close()
}

async function testWriteOnly(writeChan: WriteOnlyChannel<number>) {
  // $ExpectType Promise<{ ok: boolean }>
  writeChan.put(0)

  // $ExpectError
  writeChan.take()

  // $ExpectType void
  writeChan.close()
}

const chan = makeChan<number>()

// you can pass the same channel to both methods, and the type-safety
// will be ensured by the signatures of the methods
testReadOnly(chan)
testWriteOnly(chan)
