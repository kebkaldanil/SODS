import { ServerError } from ".";

export class InternalServerError extends ServerError<500> {
  readonly httpCode = 500;
  readonly defaultMessage = InternalServerError.name;
}
