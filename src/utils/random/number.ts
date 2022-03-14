export function lessThen(max: number) {
    return Math.random() * max;
}

export function inRange(from: number, to: number) {
    return lessThen(to - from) + from;
}
