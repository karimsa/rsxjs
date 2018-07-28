/**
 * @file src/utils.ts
 * @description Some common utilities.
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

export function isDefined(v: any): boolean {
  return (
    v !== undefined &&
    v !== null
  )
}
