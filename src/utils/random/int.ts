import { lessThen as floatLessThen } from "./number";

export function lessThen(max: number) {
  return Math.floor(Math.random() * max);
}

export function inRange(from: number, to: number) {
  return Math.floor(floatLessThen(to - from) + from);
}
