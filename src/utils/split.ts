/*export function split(str: string, separator: string, limit: 2, options?: {
  exact?: false;
  fromEnd?: boolean;
}): [string, string] | [string];
export function split(str: string, separator: string, limit: 2, options: {
  exact: true;
  fromEnd?: boolean;
}): [string, string];
export function split<T extends number>(str: string, separator: string, limit: T, options: {
  exact: true;
  fromEnd?: boolean;
}): string[] & { length: T };
export function split(str: string, separator?: string, limit?: number, options?: {
  exact?: boolean;
  fromEnd?: boolean;
}): string[];
export function split(str: string, separator = ",", limit = -1, options?: {
  exact?: boolean;
  fromEnd?: boolean;
}) {
  if (!options)
    options = {};
  const exact = options.exact ?? false;
  const fromEnd = options.fromEnd ?? false;
  if (limit < 0)
    return str.split(separator);
  if (limit === 0)
    return [];
  str = "" + str;
  if (limit === 1)
    return [str];
  const res: string[] = [];
  let count = limit;
  while (count !== 1) {
    --count;
    separator = "" + separator;
    const si = str[fromEnd ? "lastIndexOf" : "indexOf"](separator);
    if (si < 0)
      break;
    res.push(str.slice(0, si));
    str = str.slice(si + 1);
  }
  if (exact && res.length !== limit)
    throw Error(JSON.stringify(res));
  res.push(str);
  return res;
}
*/

import { Tuple } from "./array";

//type RecStr<S extends string, N extends number> = ;

//export function split<S extends string, L extends number = -1>(str: `${Exclude<string, S>}${...Tuple<string, 2>}`, separator: S, limit: L, options?: {}): Tuple<string, L>;

export function split(str: string, separator: string, limit = -1, options?: {
  exact?: boolean;
  fromEnd?: boolean;
}) {
  if (!options)
    options = {};
  const exact = options.exact ?? false;
  const fromEnd = options.fromEnd ?? false;
  if (limit < 0)
    return str.split(separator);
  if (limit === 0)
    return [];
  str = "" + str;
  if (limit === 1)
    return [str];
  const res: string[] = [];
  let count = limit;
  while (count !== 1) {
    --count;
    const si = str[fromEnd ? "lastIndexOf" : "indexOf"](separator);
    if (si < 0)
      break;
    res.push(str.slice(0, si));
    str = str.slice(si + 1);
  }
  if (exact && res.length !== limit)
    throw Error(JSON.stringify(res));
  res.push(str);
  return res;
}
