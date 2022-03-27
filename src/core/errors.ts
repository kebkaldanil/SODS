export interface ErrorWithHttpCodeConstructorOptions {
  text?: string;
  message?: string;
}

export abstract class ErrorWithHttpCode<Code extends number> extends Error {
  abstract readonly httpCode: Code;
  abstract readonly defaultMessage: string;
  constructor(readonly message?: string) {
    super(`${this.httpCode}`);
  }
}

export abstract class ClientError<Code extends number> extends ErrorWithHttpCode<Code> {}
export abstract class ServerError<Code extends number> extends ErrorWithHttpCode<Code> {}
