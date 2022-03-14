import { IncomingMessage, ServerResponse } from "http";
import { ServerOptions } from "https";
import { current, onError, fromThere, resultProcessor } from "./constants";
import { Cookie, ReceivedCookie } from "../cookie";
import { URLSearchParams } from "url";

export interface Dict<T> {
	[key: string]: T
};

export interface ReadOnlyDict<T> {
	readonly [key: string]: T;
}

export type processFunction = (o: RequestObject, path: string) => any | Promise<any>;

export type RequestMessage = IncomingMessage & {
	cookies: ReceivedCookie[];
	searchParams: URLSearchParams;
	body: Promise<string>;
}

export type ResponseMessage = ServerResponse & {
	cookies: Cookie[];
}

/** Object with all necessary properties */
export type RequestObject = {
	request: RequestMessage;
	response: ResponseMessage;
	/** full path in url */
	fullPath: string;
	/** don't touch it!!! */
	queue: ((o: RequestObject, path: string) => void)[];
	/** controlls default logging in functions */
	doLog: boolean;
};

export type PortsArr = (number[] | number | "*")[];

export interface ServOptions {
	silense?: boolean,
	mode: "http" | "https",
	serverOptions?: ServerOptions
};

export type CurrentRouteObj = processFunction | {
	[method: string]: processFunction,
	HEAD?: processFunction,
	GET?: processFunction,
	POST?: processFunction,
	PUT?: processFunction,
	DELETE?: processFunction,
	OPTIONS?: processFunction
};

export type RouteObj = {
	[current]?: CurrentRouteObj,
	[onError]?: (e: Error | { code: number }, o: RequestObject) => any,
	[fromThere]?: (o: RequestObject, path: string, declaredPath: string) => any | Promise<any>,
	[resultProcessor]?: (ret: any, o: RequestObject) => any
} & (Dict<RouteObj> | RouteObj[]) | string | processFunction;
