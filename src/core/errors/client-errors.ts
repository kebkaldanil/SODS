import { OutgoingHttpHeaders } from "http";
import { ClientError } from "./base";

export class BadRequest extends ClientError<400> {
  readonly httpCode = 400;
  readonly defaultMessage = "Bad Request";
}

export class Unauthorized<T extends string = string> extends ClientError<401> {
  readonly httpCode = 401;
  readonly defaultMessage = "Unauthorized";
  readonly headers: OutgoingHttpHeaders & {
    readonly "WWW-Authenticate": T;
  };
  constructor(authentificate: T) {
    super({
      "WWW-Authenticate": authentificate,
    });
  }
}

export class PaymentRequired extends ClientError<402> {
  readonly httpCode = 402;
  readonly defaultMessage = "Payment Required";
}

export class Forbidden extends ClientError<403> {
  readonly httpCode = 403;
  readonly defaultMessage = "Forbidden";
}

export class NotFound extends ClientError<404> {
  readonly httpCode = 404;
  readonly defaultMessage = "Not Found";
}

export class MethodNotAllowed extends ClientError<405> {
  readonly httpCode = 405;
  readonly defaultMessage = "Method Not Found";
}

export class NotAcceptable extends ClientError<406> {
  readonly httpCode = 406;
  readonly defaultMessage = "Not Acceptable";
}

export class ProxyAuthenticationRequired extends ClientError<407> {
  readonly httpCode = 407;
  readonly defaultMessage = "Proxy Authentication Required";
}

export class RequestTimeout extends ClientError<408> {
  readonly httpCode = 408;
  readonly defaultMessage = "Request Timeout";
}

export class Conflict extends ClientError<409> {
  readonly httpCode = 409;
  readonly defaultMessage = "Conflict";
}

export class Gone extends ClientError<410> {
  readonly httpCode = 410;
  readonly defaultMessage = "Gone";
}

export class LengthRequired extends ClientError<411> {
  readonly httpCode = 411;
  readonly defaultMessage = "Length Required";
}

export class PreconditionFailed extends ClientError<412> {
  readonly httpCode = 412;
  readonly defaultMessage = "Precondition Failed";
}

export class PayloadTooLarge extends ClientError<413> {
  readonly httpCode = 413;
  readonly defaultMessage = "Payload Too Large";
}

export class URI_TooLong extends ClientError<414> {
  readonly httpCode = 414;
  readonly defaultMessage = "URI Too Long";
}

export class UnsupportedMediaType extends ClientError<415> {
  readonly httpCode = 415;
  readonly defaultMessage = "Unsupported Media Type";
}

export class RangeNotSatisfiable extends ClientError<416> {
  readonly httpCode = 416;
  readonly defaultMessage = "Range Not Satisfiable";
}

export class ExpectationFailed extends ClientError<417> {
  readonly httpCode = 417;
  readonly defaultMessage = "Expectation Failed";
}
