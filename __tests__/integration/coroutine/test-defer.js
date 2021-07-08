/**
 * @file tests/coroutine/test-defer.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from "../../helpers";
import { spy } from "sinon";

import { co } from "../../../";

test("co: routine + defer", async (t) => {
  const fn = spy(() => {});
  const e = await t.throwsAsync(
    co(function* (d) {
      d(fn);
      yield Promise.reject(new Error("blah"));
    })
  );

  t.is(String(e), "Error: blah");
  t.true(fn.calledOnce);
});
