import { ReadStream } from "fs";
import * as readline from "readline";

export const args = mapArrayToObject(process.argv.slice(2), {
	allowBooleanIfOnlyKey: true
});

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
 * @returns current fromated time with miliseconds
 * @example "14:28:03.049"
 */
export function formatedTime() {
    const p = new Date();
    return time`${p.getHours()}:${p.getMinutes()}:${p.getSeconds()}.${alignNumberToLength(p.getMilliseconds(), 3)}`;
}

/**
 * fast random
 */
export function intRandbyLength(start: number, length: number) {
    return Math.floor(Math.random() * length + start);
}

/**
 * random for range
 */
export function intRandom(start: number, end: number) {
    return intRandbyLength(start, end - start);
}

export function dataCopy<T extends {}>(obj: T): {} & T {
    const res: any = {};
    for (const nm in obj) {
        const v = obj[nm];
        switch (typeof v) {
            case "object":
                res[nm] = dataCopy(v);
                break;
            case "string":
            case "number":
            case "boolean":
                res[nm] = v;
        }
    }
    return res;
}

export function notNullOrDefault<T>(value: T | null | undefined, _default: T) {
    return value === null || value === undefined ? _default : value;
}

export function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string | null | undefined, string | null | undefined, ...unknown[]] | [string | null | undefined, ...unknown[]] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError?: false;
    toManyIsError?: false;
}): ({
    [index: string]: string | true;
});

export function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string | null | undefined, string, ...unknown[]] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError?: false;
    toManyIsError?: false;
}): ({
    [index: string]: string;
});

export function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string, string | null | undefined, ...unknown[]] | [string, ...unknown[]];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError: true;
    toManyIsError?: false;
}): ({
    [index: string]: string | true;
});

export function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string, string, ...unknown[]];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError: true;
    toManyIsError?: false;
}): ({
    [index: string]: string;
});

export function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string | null | undefined, string | null | undefined] | [string | null | undefined] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError?: false;
    toManyIsError: true;
}): ({
    [index: string]: string | true;
});

export function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string | null | undefined, string] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError?: false;
    toManyIsError: true;
}): ({
    [index: string]: string;
});

export function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string, string | null | undefined] | [string];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError: true;
    toManyIsError: true;
}): ({
    [index: string]: string | true;
});

export function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string, string];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError: true;
    toManyIsError: true;
}): ({
    [index: string]: string;
});

export function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number | null | undefined, resultT | null | undefined, ...unknown[]] | [string | number | null | undefined, ...unknown[]] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError?: false;
    toManyIsError?: false;
}): ({
    [index: string]: resultT | true;
});

export function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number | null | undefined, resultT, ...unknown[]] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError?: false;
    toManyIsError?: false;
}): ({
    [index: string]: resultT;
});

export function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number, resultT | null | undefined, ...unknown[]] | [string | number, ...unknown[]];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError: true;
    toManyIsError?: false;
}): ({
    [index: string]: resultT | true;
});

export function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number, resultT, ...unknown[]];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError: true;
    toManyIsError?: false;
}): ({
    [index: string]: resultT;
});

export function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number, resultT | null | undefined] | [string | number];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError: true;
    toManyIsError: true;
}): ({
    [index: string]: resultT | true;
});

export function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number, resultT];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError: true;
    toManyIsError: true;
}): ({
    [index: string]: resultT;
});

export function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number | null | undefined, resultT | null | undefined] | [string | number | null | undefined] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError?: false;
    toManyIsError: true;
}): ({
    [index: string]: resultT | true;
});

export function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number | null | undefined, resultT] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError?: false;
    toManyIsError: true;
}): ({
    [index: string]: resultT;
});

export function mapArrayToObject<elementT, resultT>(array: elementT[], options?: {
    processor?: (el: elementT) => unknown[] | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: boolean;
    emptyIsError?: boolean;
    toManyIsError?: boolean;
}): ({
    [index: string]: resultT | true;
}) {
    if (!options)
        options = {};
    const processor = (options.processor || ((el: string) => split(el, '=', 2))) as unknown as (el: elementT) => any[];
    const throwIfError = notNullOrDefault(options.throwIfError, true);
    const allowBooleanIfOnlyKey = notNullOrDefault(options.allowBooleanIfOnlyKey, false);
    const emptyIsError = notNullOrDefault(options.emptyIsError, false);
    const toManyIsError = notNullOrDefault(options.toManyIsError, false);
    const res = {};
    array.forEach(s => {
        try {
            const a = processor(s);
            if (a) {
                switch (a.length) {
                    case 0:
                        if (emptyIsError)
                            throw new Error("Empty result");
                        break;
                    case 1:
                        if (allowBooleanIfOnlyKey)
                            throw new Error("Only key found");
                        else
                            res[a[0]] = true;
                        break;
                    default:
                        if (toManyIsError)
                            throw new Error("Too many elements in result");
                    case 2:
                        res[a[0]] = a[1];
                        break;
                }
            } else if (emptyIsError) {
                throw new Error("Empty result");
            }
        } catch(e) {
            if (throwIfError)
                throw e;
            return;
        }
    });
    return res;
}

export function split(str: string, separator: string, limit: 2, options: {
    exact: false;
    fromEnd?: boolean;
}): [string, string] | [string] | [];
export function split(str: string, separator: string, limit: 2, options?: {
    exact?: true;
    fromEnd?: boolean;
}): [string, string];
export function split<T extends number>(str: string, separator: string, limit: T, options?: {
    exact?: true;
    fromEnd?: boolean;
}): string[] & { length: T };
export function split(str: string, separator?: string, limit?: number, options?: {
    exact?: boolean;
    fromEnd?: boolean;
}): string[];
export function split(str: string, separator: string = ",", limit: number = -1, options?: {
    exact?: boolean;
    fromEnd?: boolean;
}) {
    if (!options)
        options = {};
    const exact = notNullOrDefault(options.exact, true);
    const fromEnd = notNullOrDefault(options.fromEnd, false);
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
        throw Error("");
    res.push(str);
    return res;
}

export function pipeFile(istream: ReadStream, ostream: NodeJS.WritableStream): Promise<NodeJS.WritableStream> {
	return new Promise((resolve, reject) => {
		try {
			istream.pipe(ostream, { end: false });
			istream.on("error", reject);
			istream.on("end", () => resolve(ostream));
            ostream.on("close", () => {
                istream.destroy();
                resolve(ostream);
            });
		}
		catch (e) {
			reject(e);
		}
	});
}

export function initConsoleProcessor(lineProc: (x: string) => any = (0, eval), { functionRun = true, logNulls = false } = {}) {
	const rl = readline.createInterface(process.stdin);
	rl.on("line", async line => {
		try {
			let r = await lineProc(line);
			r = (functionRun && typeof r === "function" ? await r() : r);
			if (logNulls || (r !== null && r !== undefined))
				console.log(r);
		}
		catch(e) {
			console.error(e);
		}
	});
	return rl;
}

export function computeOnce<R extends unknown, T>(obj: R, key: PropertyKey, compute: () => T): R {
    return Object.defineProperty(obj, key, {
        get: () => {
            delete obj[key];
            return obj[key] = compute();
        },
        enumerable: true,
        configurable: true
    });
}
