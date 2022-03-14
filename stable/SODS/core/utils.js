"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeOnce = exports.initConsoleProcessor = exports.pipeFile = exports.split = exports.mapArrayToObject = exports.notNullOrDefault = exports.dataCopy = exports.intRandom = exports.intRandbyLength = exports.formatedTime = exports.alignNumberToLength = exports.time = exports.args = void 0;
const readline = require("readline");
exports.args = mapArrayToObject(process.argv.slice(2), {
    allowBooleanIfOnlyKey: true,
    emptyIsError: false
});
Object.freeze(exports.args);
function time(strings, ...params) {
    let res = "";
    let i = 0;
    while (i < params.length) {
        const tmp = params[i];
        const num = typeof tmp === "number" ? alignNumberToLength(tmp, 2) : tmp;
        res += strings[i++] + num;
    }
    return res + strings[i];
}
exports.time = time;
const nulls = "000000000000";
function alignNumberToLength(num, length) {
    const bs = "" + Math.trunc(num);
    return nulls.slice(nulls.length + bs.length - length) + bs;
}
exports.alignNumberToLength = alignNumberToLength;
function formatedTime() {
    const p = new Date();
    return time `${p.getHours()}:${p.getMinutes()}:${p.getSeconds()}.${alignNumberToLength(p.getMilliseconds(), 3)}`;
}
exports.formatedTime = formatedTime;
function intRandbyLength(start, length) {
    return Math.floor(Math.random() * length + start);
}
exports.intRandbyLength = intRandbyLength;
function intRandom(start, end) {
    return intRandbyLength(start, end - start);
}
exports.intRandom = intRandom;
function dataCopy(obj) {
    const res = {};
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
exports.dataCopy = dataCopy;
function notNullOrDefault(value, _default) {
    return value === null || value === undefined ? _default : value;
}
exports.notNullOrDefault = notNullOrDefault;
function mapArrayToObject(array, options) {
    if (!options)
        options = {};
    const processor = (options.processor || ((el) => split(el, '=', 2)));
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
            }
            else if (emptyIsError) {
                throw new Error("Empty result");
            }
        }
        catch (e) {
            console.log(array);
            if (throwIfError)
                throw e;
            return;
        }
    });
    return res;
}
exports.mapArrayToObject = mapArrayToObject;
function split(str, separator = ",", limit = -1, options) {
    if (!options)
        options = {};
    const exact = notNullOrDefault(options.exact, false);
    const fromEnd = notNullOrDefault(options.fromEnd, false);
    if (limit < 0)
        return str.split(separator);
    if (limit === 0)
        return [];
    str = "" + str;
    if (limit === 1)
        return [str];
    const res = [];
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
exports.split = split;
function pipeFile(istream, ostream) {
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
exports.pipeFile = pipeFile;
function initConsoleProcessor(lineProc = (0, eval), { functionRun = true, logNulls = false } = {}) {
    const rl = readline.createInterface(process.stdin);
    rl.on("line", async (line) => {
        try {
            let r = await lineProc(line);
            r = (functionRun && typeof r === "function" ? await r() : r);
            if (logNulls || (r !== null && r !== undefined))
                console.log(r);
        }
        catch (e) {
            console.error(e);
        }
    });
    return rl;
}
exports.initConsoleProcessor = initConsoleProcessor;
function computeOnce(obj, key, compute) {
    return Object.defineProperty(obj, key, {
        get: () => {
            delete obj[key];
            return obj[key] = compute();
        },
        enumerable: true,
        configurable: true
    });
}
exports.computeOnce = computeOnce;
//# sourceMappingURL=utils.js.map