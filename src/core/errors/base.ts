import { OutgoingHttpHeaders } from "http";
import { ResponseMessage } from "../types";

export interface ErrorWithHttpCodeConstructorOptions {
  text?: string;
  message?: string;
}

export abstract class ErrorWithHttpCode<Code extends number> extends Error {
  abstract readonly httpCode: Code;

  readonly headers?: OutgoingHttpHeaders;

  constructor(headers: OutgoingHttpHeaders, message?: string);
  constructor(message?: string);

  constructor(
    headersOrMessage?: OutgoingHttpHeaders | string,
    message?: string,
  ) {
    if (typeof headersOrMessage === "string" && message == null) {
      super(headersOrMessage);
    } else {
      super(message);
      this.headers = headersOrMessage as OutgoingHttpHeaders;
    }
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
