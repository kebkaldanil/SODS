const nulls = "000000000000";

/**
 * @param num number to align
 * @param length result length
 * @returns number converted to string aligned by length
 */
export function alignNumberToLength(num: number, length: number) {
    const bs = "" + Math.trunc(num);
    return nulls.slice(nulls.length + bs.length - length) + bs;
}

/**
 * tag function for time formatting
 * 
 * @example
 * const date = new Date();
 * const hours = date.getHours();
 * const minutes = date.getMinutes();
 * const seconds = date.getSeconds();
 * consloe.log(time\`${hours}:${minutes}:${seconds}\`);
 * //"14:28:03"
 */
export function time(strings: TemplateStringsArray, ...params: any[]) {
    let res = "";
    let i = 0;
    while (i < params.length) {
        const tmp = params[i];
        const num = typeof tmp === "number" ? alignNumberToLength(tmp, 2) : tmp;
        res += strings[i++] + num;
    }
    return res + strings[i];
}

/**
 * @returns current fromated time with miliseconds
 * @example "14:28:03.049"
 */
export function formatedTime() {
    const p = new Date();
    return time`${p.getHours()}:${p.getMinutes()}:${p.getSeconds()}.${alignNumberToLength(p.getMilliseconds(), 3)}`;
}

export function roundNumber(value: number, to = 1) {
    return Math.round(value / to) * to;
}

export function numberOrDefault(value: unknown, _default = 0) {
    const num = +value;
    return num || num === 0 ? num : _default;
}

export function integerOrDefault(value: unknown, _default = 0) {
    /**@ts-ignore */
    const num = value | 0;
    return num || num === 0 ? num : _default;
}
