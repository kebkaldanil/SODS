export interface Mime {
  getType(path: string): string | null;
  getExtension(mime: string): string | null;
}

let current: Mime = await (async () => {
  try {
    return await import("mime");
  } catch {
    return await import("./small-mime");
  }
})();

export async function setMime(mime: Promise<Mime> | Mime) {
  current = await mime;
}

export function getType(path: string) {
  return current.getType(path);
}
export function getExtension(mime: string) {
  return current.getExtension(mime);
}
export default {
  getType,
  getExtension,
};
