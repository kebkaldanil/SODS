/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CustomError } from "../decorators/custom-error.decorator";

declare function require<T = unknown>(path: string): T;

export interface Mime {
  getType(path: string): string | null;
  getExtension(mime: string): string | null;
}

let mimeModule: Mime | undefined;

@CustomError()
export class MimeModuleNotFound extends Error {
  constructor() {
    super("Can not find mime module. Use \"setMime\" function");
  }
}

@CustomError()
export class MimeImportError extends Error {
  constructor(path?: string) {
    super(`Module must have "getType" and "getExtension" methods${path ? `(module path: "${path}")` : ""}`);
  }
}

export function setMime<T extends Mime = Mime>(_module: T | string) {
  const foundModule = typeof _module === "string" ? require<Mime>(_module) : _module;
  if (typeof foundModule === "object" && typeof foundModule.getType === "function" && typeof foundModule.getExtension === "function") {
    mimeModule = foundModule;
  } else {
    throw new MimeImportError(typeof _module === "string" ? _module : undefined);
  }
}

function tryImportOrDie() {
  try {
    setMime("mime");
  } catch {
    try {
      setMime("../../utils/small-mime");
    } catch {
      throw new MimeModuleNotFound;
    }
  }
}

export function getType(path: string) {
  if (!mimeModule) {
    tryImportOrDie();
  }
  return mimeModule!.getType(path);
}

export function getExtension(mime: string) {
  if (!mimeModule) {
    tryImportOrDie();
  }
  return mimeModule!.getExtension(mime);
}

const mime = {
  getType,
  getExtension,
  setMime,
};

export default mime;
