/// <reference types="node" />
import { Stats } from "fs";
import { OutgoingHttpHeaders, RequestListener, Server } from "http";
import { ServerOptions } from "https";
import { PortsArr, RequestMessage, RequestObject, ResponseMessage, RouteObj, ServOptions } from "./types";
export declare function json(o: RequestObject, data: any): Buffer;
export declare function createProcessor(routeObj: RouteObj): RequestListener;
export declare function crt(processor: RequestListener, port: number, options?: ServOptions): Promise<Server>;
export declare function file2response(o: RequestObject, path: string, ranges?: string | {
    start?: number;
    end?: number;
}[], type?: string, head?: OutgoingHttpHeaders, filestat?: Stats): Promise<void>;
export declare function fileAsResponse(path: string, options?: {
    doLog?: boolean;
    hostingLike?: boolean;
    useRange?: boolean;
    mime?: ((x: string) => string) | string;
    logErrors?: boolean;
    logRanges?: boolean;
}): (o: RequestObject, p: string) => Promise<void>;
export declare function createSubServer(processor: RequestListener, ports: PortsArr, options?: ServOptions): Promise<{
    [x: number]: Server;
}>;
export declare function defaultServerStart(routeObj: RouteObj, evalF?: typeof eval, serverOptions?: ServerOptions, httpPort?: PortsArr | number, httpsPort?: PortsArr | number): Promise<{
    [port: number]: Server;
    processor: (request: RequestMessage, response: ResponseMessage) => void;
}>;
declare type fastResponseOptions = {
    code?: number;
    headers?: OutgoingHttpHeaders;
    body?: any;
    doLog?: boolean;
    statusText?: string;
};
export declare function fastResponse(o: RequestObject, code: number): Promise<void>;
export declare function fastResponse(o: RequestObject, options: fastResponseOptions): Promise<void>;
export declare function ok(o: RequestObject, body?: any, doLog?: boolean): Promise<void>;
export declare function redirect(o: RequestObject, to: string, doLog?: boolean): Promise<void>;
export declare function notFound(o: RequestObject, doLog?: boolean): Promise<void>;
export declare class crudBuilder {
    private usedMethods;
    private processors;
    constructor();
    useMethod(method: string, cb: (o: RequestObject, path: string) => any, priority?: number): this;
    get(cb: (path: string, get: NodeJS.Dict<string | boolean>, o: RequestObject) => any, priority?: number): this;
    getRoot(cb: (get: NodeJS.Dict<string | boolean>, o: RequestObject) => any): this;
    post(cb: (path: string, body: string, o: RequestObject) => any, priority?: number): this;
    postForm(cb: (path: string, post: NodeJS.Dict<string | boolean>, o: RequestObject) => any, priority?: number): this;
    postJson(cb: (path: string, obj: any, o: RequestObject) => any, priority?: number): this;
    put(cb: (path: string, body: string, o: RequestObject) => any, priority?: number): this;
    delete(cb: (path: string, get: NodeJS.Dict<string | boolean>, o: RequestObject) => any, priority?: number): this;
    build(): RouteObj;
}
export declare function printIPs(tabs?: number, printInternal?: boolean): void;
export {};
