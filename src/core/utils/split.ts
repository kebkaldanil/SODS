import { Tuple } from "..";

export function split<
  L extends number = -1,
  TExact extends boolean = false,
>(
  str: string,
  separator: string,
  limit?: L,
  options?: {
    exact?: TExact,
    fromEnd?: boolean
  }
): TExact extends true ? L extends -1 ? string[] : Tuple<string, L> : string[];

export function split(str: string, separator: string, limit = -1, options?: {
  exact?: boolean;
  fromEnd?: boolean;
}) {
  const { exact = false, fromEnd = false } = options || {};
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
