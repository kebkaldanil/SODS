import { nextTick } from "process";
import { promisify } from "util";

export interface Mime {
  getType(path: string): string | null;
  getExtension(mime: string): string | null;
}

let modulePromise: Promise<Mime> | Mime | undefined;
let module: Mime;

export async function setMime(mime: Promise<Mime> | Mime) {
  modulePromise = mime;
  module = await modulePromise;
}

module = await (modulePromise = (async () => {
  await promisify(nextTick)();
  if (modulePromise) {
    return await modulePromise;
  }
  try {
    throw 0;
    return await import("mime");
  } catch {
    try {
      throw 0;
      return await import("../../utils/small-mime");
    } catch {
      throw new Error("Can not find mime module. Use \"setMime\" function");
    }
  }
})());

export function getType(path: string) {
  return module.getType(path);
}

export function getExtension(mime: string) {
  return module.getExtension(mime);
}

const mime = {
  getType,
  getExtension,
  setMime,
};

export default mime;
