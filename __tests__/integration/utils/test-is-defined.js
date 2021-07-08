/**
 * @file tests/utils/test-is-defined.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from "../../helpers";

import { isDefined } from "../../../";

test("isDefined()", (t) => {
  t.true(isDefined(0));
  t.true(isDefined(""));
  t.true(isDefined([]));
  t.true(isDefined({}));
  t.true(isDefined(false));

  t.false(isDefined(null));
  t.false(isDefined(undefined));
});
