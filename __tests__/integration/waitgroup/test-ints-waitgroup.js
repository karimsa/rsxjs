/**
 * @file tests/waitgroup/test-ints-waitgroup.js
 * @description Testing raw behavior of WaitGroup with simple integer pushing.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from "../../helpers";

import { WaitGroup } from "../../../";

const SIZE = 10;
const DELAY = 100;

test("waitgroup: with ints", async (t) => {
  const wg = new WaitGroup();

  const start = Date.now();
  for (let i = 0; i < SIZE; ++i) {
    wg.add(1);
    setTimeout(() => wg.done(), DELAY);
  }
  await wg.wait();

  const dur = Date.now() - start;
  t.true(dur >= DELAY, `Took ${dur}ms, should've taken more than ${DELAY}ms`);
});

test("waitgroup: should not hang on empty waitgroup", async (t) => {
  await new WaitGroup().wait();
  t.true(true, "WaitGroup should not hang");
});
