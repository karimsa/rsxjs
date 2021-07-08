/**
 * @file tests/utils/test-delay.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from "../../helpers";

import { delay } from "../../../";

test("delay", async (t) => {
  const timeout = 100;
  const start = Date.now();
  await delay(timeout);
  t.true(Date.now() - start >= timeout);
});
