/**
 * @file tests/semaphore/test-semaphore.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from "../../helpers";
import { delay } from "bluebird";

import { Semaphore } from "../../../";

test("fromAsync()", async (t) => {
  const SIZE = 2;
  const DELAY = 1000;

  const frames = {};
  const work = Semaphore.fromAsync(
    function worker(data) {
      frames[data.message] = Date.now();
      return delay(DELAY + 1);
    },
    {
      size: SIZE,
    }
  );

  await Promise.all([
    work({ message: "a" }),
    work({ message: "b" }),
    work({ message: "c" }),
    work({ message: "d" }),
    work({ message: "e" }),
  ]);

  t.true(frames.b - frames.a <= 100, "a and b should be run concurrently");
  t.true(
    frames.c - Math.min(frames.a, frames.b) >= 500,
    "c and a,b should have a pause in between"
  );
  t.true(frames.d - frames.c <= 100, "c and d should be run concurrently");
  t.true(
    frames.e - Math.min(frames.c, frames.d) >= 500,
    "e and c,d should have a pause in between"
  );
});
