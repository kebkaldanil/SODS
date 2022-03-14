/// <reference types="node" />
import { ReadStream } from "fs";
import * as readline from "readline";
import { ReadOnlyDict } from "./types";
export declare const args: ReadOnlyDict<string | true>;
export declare function time(strings: TemplateStringsArray, ...params: any[]): string;
export declare function alignNumberToLength(num: number, length: number): string;
export declare function formatedTime(): string;
export declare function intRandbyLength(start: number, length: number): number;
export declare function intRandom(start: number, end: number): number;
export declare function dataCopy<T extends {}>(obj: T): {} & T;
export declare function notNullOrDefault<T>(value: T | null | undefined, _default: T): T;
export declare function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string | null | undefined, string | null | undefined, ...unknown[]] | [string | null | undefined, ...unknown[]] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError?: false;
    toManyIsError?: false;
}): ({
    [index: string]: string | true;
});
export declare function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string | null | undefined, string, ...unknown[]] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError?: false;
    toManyIsError?: false;
}): ({
    [index: string]: string;
});
export declare function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string, string | null | undefined, ...unknown[]] | [string, ...unknown[]];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError: true;
    toManyIsError?: false;
}): ({
    [index: string]: string | true;
});
export declare function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string, string, ...unknown[]];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError: true;
    toManyIsError?: false;
}): ({
    [index: string]: string;
});
export declare function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string | null | undefined, string | null | undefined] | [string | null | undefined] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError?: false;
    toManyIsError: true;
}): ({
    [index: string]: string | true;
});
export declare function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string | null | undefined, string] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError?: false;
    toManyIsError: true;
}): ({
    [index: string]: string;
});
export declare function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string, string | null | undefined] | [string];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError: true;
    toManyIsError: true;
}): ({
    [index: string]: string | true;
});
export declare function mapArrayToObject(array: string[], options?: {
    processor?: (el: string) => [string, string];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError: true;
    toManyIsError: true;
}): ({
    [index: string]: string;
});
export declare function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number | null | undefined, resultT | null | undefined, ...unknown[]] | [string | number | null | undefined, ...unknown[]] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError?: false;
    toManyIsError?: false;
}): ({
    [index: string]: resultT | true;
});
export declare function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number | null | undefined, resultT, ...unknown[]] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError?: false;
    toManyIsError?: false;
}): ({
    [index: string]: resultT;
});
export declare function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number, resultT | null | undefined, ...unknown[]] | [string | number, ...unknown[]];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError: true;
    toManyIsError?: false;
}): ({
    [index: string]: resultT | true;
});
export declare function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number, resultT, ...unknown[]];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError: true;
    toManyIsError?: false;
}): ({
    [index: string]: resultT;
});
export declare function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number, resultT | null | undefined] | [string | number];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError: true;
    toManyIsError: true;
}): ({
    [index: string]: resultT | true;
});
export declare function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number, resultT];
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError: true;
    toManyIsError: true;
}): ({
    [index: string]: resultT;
});
export declare function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number | null | undefined, resultT | null | undefined] | [string | number | null | undefined] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey: true;
    emptyIsError?: false;
    toManyIsError: true;
}): ({
    [index: string]: resultT | true;
});
export declare function mapArrayToObject<elementT, resultT>(array: elementT[], options: {
    processor: (el: elementT) => [string | number | null | undefined, resultT] | [] | null | undefined | void;
    throwIfError?: boolean;
    allowBooleanIfOnlyKey?: false;
    emptyIsError?: false;
    toManyIsError: true;
}): ({
    [index: string]: resultT;
});
export declare function split(str: string, separator: string, limit: 2, options?: {
    exact?: false;
    fromEnd?: boolean;
}): [string, string] | [string] | [];
export declare function split(str: string, separator: string, limit: 2, options: {
    exact: true;
    fromEnd?: boolean;
}): [string, string];
export declare function split<T extends number>(str: string, separator: string, limit: T, options: {
    exact: true;
    fromEnd?: boolean;
}): string[] & {
    length: T;
};
export declare function split(str: string, separator?: string, limit?: number, options?: {
    exact?: boolean;
    fromEnd?: boolean;
}): string[];
export declare function pipeFile(istream: ReadStream, ostream: NodeJS.WritableStream): Promise<NodeJS.WritableStream>;
export declare function initConsoleProcessor(lineProc?: (x: string) => any, { functionRun, logNulls }?: {
    functionRun?: boolean;
    logNulls?: boolean;
}): readline.Interface;
export declare function computeOnce<R extends unknown, T>(obj: R, key: PropertyKey, compute: () => T): R;
