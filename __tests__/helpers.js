import { test as globalTest, expect } from "@jest/globals";

const t = {
  is: (a, b) => expect(a).toEqual(b),
  not: (a, b) => expect(a).not.toEqual(b),
  deepEqual: (a, b) => expect(a).toEqual(b),
  true: (a) => expect(a).toEqual(true),
  false: (a) => expect(a).toEqual(false),
  throws: (fn) => {
    try {
      fn();
      throw new Error(`Function did not throw error`);
    } catch (err) {
      if (String(err).includes("Function did not throw error")) {
        throw err;
      }
      return err;
    }
  },
  throwsAsync: (promise) =>
    promise.then(
      () => {
        throw new Error(`Promise resolved instead of rejected`);
      },
      (err) => err
    ),
};

export function test(name, testFn) {
  globalTest(name, () => testFn(t));
}

test.only = function (name, testFn) {
  globalTest.only(name, () => testFn(t));
};
