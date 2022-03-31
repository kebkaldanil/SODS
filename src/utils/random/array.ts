import { int, number } from ".";
import { integerOrDefault, numberOrDefault } from "..";
import { split } from "../../core/utils/split";

export type AccesibleType = "number" | "int" | `string:${string}-${string}` | `number:${number}-${number}` | `int:${number}-${number}`;
export const array = {
  of(type: AccesibleType, length: number) {
    const [gtype, srange] = split(type, ":", 2);
    const srangeDeli = srange?.indexOf("-", 1);
    let fromAsString: string;
    let toAsString: string;
    if (srangeDeli !== void 0 && srangeDeli !== -1) {
      fromAsString = srange.slice(0, srangeDeli);
      toAsString = srange.slice(srangeDeli + 1);
    } else {
      toAsString = srange;
    }
    switch (gtype) {
      case "number": {
        const result = <number[]>[];
        const from = +fromAsString || 0;
        const to = numberOrDefault(toAsString, 1);
        for (let i = 0; i < length; i++) {
          result[i] = number.inRange(from, to);
        }
        return result;
      }
      case "int": {
        const result = <number[]>[];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        /**@ts-ignore */
        const from = fromAsString | 0;
        const to = integerOrDefault(toAsString, Number.MAX_SAFE_INTEGER);
        for (let i = 0; i < length; i++) {
          result[i] = int.inRange(from, to);
        }
        return result;
      }
      case "string": {
        const result = <string[]>[];
        for (let i = 0; i < length; i++) {
          const length = int.inRange(fromAsString.length, toAsString.length + 1);
          let str = "";
          for (let stri = 0; stri < length; stri++) {
            str += String.fromCodePoint(
              int.inRange(
                fromAsString.codePointAt(stri),
                toAsString.codePointAt(stri),
              ),
            );
          }
          result[i] = str;
        }
        return result;
      }
    }
  },
} as {
  of(
    type: "number" | "int" | `number:${number}-${number}` | `int:${number}-${number}`,
    length: number
  ): number[];
  of(
    type: `string:${string}-${string}`,
    length: number
  ): string[];
};
