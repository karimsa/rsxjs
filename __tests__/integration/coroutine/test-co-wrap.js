/**
 * @file tests/coroutine/test-co-wrap.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from "../../helpers";

import { co } from "../../../";

test("co: wrapped routine", async (t) => {
  let state = 0;
  const fn = co.wrap(function* () {
    state += yield Promise.resolve(1);
    state += yield Promise.resolve(2);
    yield Promise.reject(new Error("blah"));
  });

  const e = await t.throwsAsync(fn());
  t.is(state, 3);
  t.is(String(e), "Error: blah");
});
