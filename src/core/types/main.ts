import { IncomingMessage, ServerOptions, ServerResponse } from "http";
import { Cookie, ReceivedCookie } from "../cookie";

export interface RequestMessage extends IncomingMessage {
  cookies: ReceivedCookie[];
  searchParams: URLSearchParams;
  body: Promise<string>;
}

export interface ResponseMessage extends ServerResponse {
  cookies: Cookie[];
};

/** Object with all necessary properties */
export interface RequestObject {
  request: RequestMessage;
  response: ResponseMessage;
  /** full path in url */
  fullPath: string;
  /** don't touch it!!! */
  queue: ((o: RequestObject, path: string) => void)[];
  /** controlls default logging in functions */
  doLog: boolean;
};

export interface ServOptions {
  silense?: boolean,
  mode: "http" | "https",
  serverOptions?: ServerOptions,
};

export type PortsArr = (number[] | number | "*")[];

export type ReplaceNever<T, U> = T extends never ? U : T;
