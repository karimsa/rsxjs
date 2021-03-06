/**
 * @file tests/semaphore/test-fail-fast.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from "../../helpers";

import { Semaphore } from "../../../";

test("fromAsync()#failFast", async (t) => {
  const SIZE = 2;
  const work = Semaphore.fromAsync(() => new Promise(() => {}), {
    size: SIZE,
    failFast: true,
  });

  work();
  work();

  await t.throwsAsync(work());
});
