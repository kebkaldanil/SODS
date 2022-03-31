import { OutgoingHttpHeaders } from "http";
import { ResponseMessage } from "../types";

export interface ErrorWithHttpCodeConstructorOptions {
  text?: string;
  message?: string;
}

export abstract class ErrorWithHttpCode<Code extends number> extends Error {
  abstract readonly httpCode: Code;

  readonly headers?: OutgoingHttpHeaders;

  constructor(headers?: OutgoingHttpHeaders);
  constructor(message: string, headers: OutgoingHttpHeaders);

  constructor(
    messageOrHeaders?: string | OutgoingHttpHeaders,
    headers?: OutgoingHttpHeaders
  ) {
    let message: string | undefined;
    if (typeof messageOrHeaders === "string") {
      message = messageOrHeaders;
    } else {
      headers = messageOrHeaders;
    }
    super(message);
    this.headers = headers;
  }

  send(res: ResponseMessage) {
    res.writeHead(this.httpCode, this.message, this.headers);
  }
}

abstract class DeclaredHttpErrors<Code extends number> extends ErrorWithHttpCode<Code> {
  abstract readonly defaultMessage: string;

  send(res: ResponseMessage) {
    res.writeHead(this.httpCode, this.message || this.defaultMessage, this.headers);
  }
}

export abstract class ClientError<Code extends number> extends DeclaredHttpErrors<Code> {}
export abstract class ServerError<Code extends number> extends DeclaredHttpErrors<Code> {}
