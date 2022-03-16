import { split } from "./split";

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

export function computePropertyOnce<R extends {}, I extends keyof R>(obj: R, key: I, compute: () => R[I]): R {
    return Object.defineProperty(obj, key, {
        get: () => {
            delete obj[key];
            return obj[key] = compute();
        },
        enumerable: true,
        configurable: true
    });
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
    const throwIfError = options.throwIfError ?? true;
    const allowBooleanIfOnlyKey = options.allowBooleanIfOnlyKey ?? false;
    const emptyIsError = options.emptyIsError ?? false;
    const toManyIsError = options.toManyIsError ?? false;
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
                            res[a[0]] = true;
                        else
                            throw new Error("Only key found");
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
            console.log(array);
            if (throwIfError)
                throw e;
            return;
        }
    });
    return res;
}
