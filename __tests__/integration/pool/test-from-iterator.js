/**
 * @file tests/pool/test-from-iterable.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { test } from "../../helpers";
import { spy } from "sinon";

import { Pool } from "../../../";

test("fromIterator()", async (t) => {
  let nextWorkerName;
  let workersAllocated = 0;
  const availability = {};

  function* allocateWorkers() {
    while (true) {
      ++workersAllocated;

      const name = nextWorkerName;
      const worker = {
        name,
        isAvailable() {
          return availability[name];
        },
      };

      spy(worker, "isAvailable");
      yield worker;
    }
  }

  const pool = Pool.fromIterator(allocateWorkers(), {
    // ...
  });

  nextWorkerName = "workerA";
  availability[nextWorkerName] = true;
  const workerA = pool.getWorker();

  t.is(workerA.name, "workerA", "new worker should be allocated");
  t.true(
    workerA.isAvailable.calledOnce,
    "availability should have only been checked once"
  );

  const workerB = pool.getWorker();
  t.is(workersAllocated, 1, "only one worker should be allocated so far");
  t.is(workerB, workerA, "same worker should be used");
  t.is(
    workerB.isAvailable.callCount,
    2,
    "availability should have only been checked once"
  );

  nextWorkerName = "workerC";
  availability["workerA"] = false;
  availability["workerC"] = true;

  const workerC = pool.getWorker();
  t.is(
    workersAllocated,
    2,
    "a new worker should be allocated since a is not available"
  );
  t.not(workerC, workerA, "new worker should be allocated");
  t.is(workerC.name, "workerC");
  t.true(
    workerC.isAvailable.calledOnce,
    "availability should have only been checked once"
  );
});
