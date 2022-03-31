import { substrAfterLast } from "../core/utils/formaters";
import { swapKeyAndValue } from "../core/utils/object";

const mimeTable = <const>{
  //text
  "txt": "text/plain",
  "css": "text/css",
  "html": "text/html",
  "xml": "application/xml",
  "xhtml": "application/xhtml+xml",
  "js": "text/javasrcipt",
  "jsm": "text/javasrcipt",
  //image
  "apng": "image/apng",
  "avif": "image/avif",
  "gif": "image/gif",
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "jfif": "image/jpeg",
  "pjpeg": "image/jpeg",
  "pjp": "image/jpeg",
  "png": "image/png",
  "svg": "image/svg+xml",
  "webp": "image/webp",
  "bmp": "image/bmp",
  "ico": "image/x-icon",
  "cur": "image/x-icon",
  "tif": "image/tiff",
  "tiff": "image/tiff",
  //audio
  "wav": "audio/wave",
  "weba": "audio/webm",
  "ogg": "audio/ogg",
  "oga": "audio/ogg",
  "spx": "audio/ogg",
  "opus": "audio/ogg",
  //video
  "webm": "video/webm",
  "ogv": "video/ogg",
  //media?
  "ogx": "application/ogg",
  //other
  "zip": "application/zip",
  "rar": "application/x-rar-compressed",
};

const extensionTable = Object.assign(
  swapKeyAndValue(mimeTable),
  {
    //text
    "text/ecmascript": "js",
    "application/javascript": "js",
    "application/ecmascript": "js",
    //audio
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/x-pn-wav": "wav",
  },
);

export type SupportedExtensions = keyof typeof mimeTable;
export type SupportedMime = keyof typeof extensionTable;

export function getType<T extends string>(path: `${string}.${T}`): T extends SupportedExtensions ? string : null {
  const extension = substrAfterLast(path, ".") || path;
  return mimeTable[extension.toLowerCase()] || null;
}

export function getExtension<T extends string>(mime: T): T extends SupportedMime ? string : null {
  return extensionTable[mime.toLowerCase()] || null;
}
