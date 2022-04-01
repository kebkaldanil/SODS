import "reflect-metadata";
import { CustomError } from "../../core/decorators/custom-error.decorator";

const argumentKeyMetadata = Symbol("Argument key metadata");
const restArguments = Symbol("Rest arguments");

export type ArgumentKey = `-${string}`;

@CustomError()
export class NoArgumentKeyError extends Error {
  constructor(key: string) {
    super("Bad argument key " + key);
  }
}

export function Argument(key?: ArgumentKey): PropertyDecorator {
  return Reflect.metadata(argumentKeyMetadata, key);
}

export function RestArguments(): PropertyDecorator {
  return Reflect.metadata(argumentKeyMetadata, restArguments);
}

export function getArgumentKey(target: object, propertyKey: string | symbol) {
  const foundArgumentKey: ArgumentKey | typeof restArguments = Reflect.getMetadata(argumentKeyMetadata, target, propertyKey)
        || "--" + (typeof propertyKey === "string" ? propertyKey : propertyKey.description);
  if (foundArgumentKey === "--") {
    throw new NoArgumentKeyError(foundArgumentKey);
  }
  return foundArgumentKey;
}

export function getArgumentOptions(target: object, propertyKey: string | symbol) {
  const key = getArgumentKey(target, propertyKey);
  return {
    key,
  };
}
