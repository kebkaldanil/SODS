/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "http";
import { ServerOptions } from "https";
import { current, onError, fromThere, resultProcessor } from "./constants";
import { Cookie, ReceivedCookie } from "../cookie";
export interface Dict<T> {
    [key: string]: T;
}
export interface ReadOnlyDict<T> {
    readonly [key: string]: T;
}
export declare type processFunction = (o: RequestObject, path: string) => any | Promise<any>;
export declare type RequestMessage = IncomingMessage & {
    cookies: ReceivedCookie[];
    stringParams: NodeJS.ReadOnlyDict<string | boolean>;
    body: Promise<string>;
};
export declare type ResponseMessage = ServerResponse & {
    cookies: Cookie[];
};
export declare type RequestObject = {
    request: RequestMessage;
    response: ResponseMessage;
    fullPath: string;
    queue: ((o: RequestObject, path: string) => void)[];
    doLog: boolean;
};
export declare type PortsArr = (number[] | number | "*")[];
export interface ServOptions {
    silense?: boolean;
    mode: "http" | "https";
    serverOptions?: ServerOptions;
}
export declare type CurrentRouteObj = processFunction | {
    [method: string]: processFunction;
    HEAD?: processFunction;
    GET?: processFunction;
    POST?: processFunction;
    PUT?: processFunction;
    DELETE?: processFunction;
    OPTIONS?: processFunction;
};
export declare type RouteObj = ({
    [current]?: CurrentRouteObj;
    [onError]?: (e: Error | {
        code: number;
    }, o: RequestObject) => any;
    [fromThere]?: (o: RequestObject, path: string, declaredPath: string) => any | Promise<any>;
    [resultProcessor]?: (ret: any, o: RequestObject) => any;
} & (Dict<RouteObj> | RouteObj[])) | string | processFunction;
