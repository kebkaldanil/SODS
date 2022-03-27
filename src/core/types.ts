import { IncomingMessage, ServerResponse } from "http";
import { ServerOptions } from "https";
import { current, onError, fromThere, resultProcessor } from "./constants";
import { Cookie, ReceivedCookie } from "../cookie";
import { URLSearchParams } from "url";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KeyOfAny = keyof any;

export interface Dict<T> {
  [key: string]: T
};

export interface ReadOnlyDict<T> {
  readonly [key: string]: T;
}

export type processFunction<T = unknown> = (o: RequestObject, path: string) => T | Promise<T>;

export type RequestMessage<extendT extends object = object> = IncomingMessage & extendT & {
  cookies: ReceivedCookie[];
  searchParams: URLSearchParams;
  body: Promise<string>;
}

export type ResponseMessage<exetendT extends object = object> = ServerResponse & exetendT & {
  cookies: Cookie[];
};

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

export type RouteLeaf<T = unknown> = processFunction<T> | {
  [method: string]: processFunction<T>,
  HEAD?: processFunction<T>,
  GET?: processFunction<T>,
  POST?: processFunction<T>,
  PUT?: processFunction<T>,
  DELETE?: processFunction<T>,
  OPTIONS?: processFunction<T>
};

interface IResultProcessor<T, R> {
  [resultProcessor]: (ret: T, o: RequestObject) => R | Promise<R>
}

export interface RouteBranchWithoutResultProcessor<T = unknown> extends Partial<IResultProcessor<T, T>> {
  [current]?: RouteLeaf<T>;
  [onError]?: (e: Error | { code: number }, o: RequestObject) => T;
  [fromThere]?: (o: RequestObject, path: string, declaredPath: string) => T | Promise<T>;
}

export type RouteBranchWithResultProcessor<T = unknown, R = T> = IResultProcessor<T, R> & RouteBranchWithoutResultProcessor<T>;

export type RouteBranch<T = unknown, R = T> = (
  T extends R ? RouteBranchWithoutResultProcessor<R> : RouteBranchWithResultProcessor<T, R>
) & (Dict<RouteBranch<T>> | RouteBranch<T>[]) | string | processFunction<T>;
