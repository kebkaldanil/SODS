import fs, { PathLike } from "fs";
import { URL } from "url";
import { Buffer } from "buffer";
import { ResponseMessage } from "../core";
import { getExtension } from "../core/utils/mime";
import { extendsObjectWithOnceComputedProperties } from "../core/utils/object";
import { split } from "../core/utils/split";
import { CustomError } from "../core/decorators/custom-error.decorator";

@CustomError()
export class ParseFileRangeError extends Error { }

export type DirtyFileRange = [number | null, number] | [number, null];
export type FileRange = [number, number];

export function parseFileRanges(src: string): DirtyFileRange[] {
  return src.split(",").map((rangeSrc) => {
    const [from, to] = split(rangeSrc, "-", 2, { exact: true })
      .map((value) => {
        const num = +value;
        if (Number.isSafeInteger(num) && num >= 0) {
          return num;
        }
        if (value.trim() === "") {
          return null;
        }
        throw new ParseFileRangeError(`"${rangeSrc} is not valid range"`);
      });
    if (from === null && to === null) {
      throw new ParseFileRangeError(`"${rangeSrc} is not valid range"`);
    }
    return <DirtyFileRange>[from, to];
  });
}

export function fixFileRanges(src: ReturnType<typeof parseFileRanges>, fileSize: number): FileRange[] {
  return src.map<[number, number] | null>(([from, to]) => {
    if (from === null) {
      [from, to] = [Math.max(fileSize - <number>to, 0), fileSize];
    } else if (to === null || to > fileSize) {
      to = fileSize - 1;
    }
    if (to <= from) {
      return null;
    }
    return [from, to];
  }).filter((v): v is FileRange => v as unknown as boolean);
}

export interface SendFileOptions {
  //boundry?: string | (),
  ranges?: string | DirtyFileRange[],
  mime?: string | ((path: string) => string) | null,
  fileSize?: number,
  mimeSniffing?: boolean,
}

export async function sendFile(response: ResponseMessage, path: PathLike, options: SendFileOptions = {}) {
  const {
    fileSize = (await fs.promises.stat(path)).size,
    mime = getExtension,
    ranges,
    mimeSniffing,
    //boundry,
  } = options;
  const parsedRanges = ranges ?
    fixFileRanges(
      typeof ranges === "string" ?
        parseFileRanges(ranges)
        : ranges, fileSize,
    )
    : null;
  let foundMime: string | null;
  if (typeof mime === "function") {
    let partOfPath: string;
    if (path instanceof URL) {
      partOfPath = path.pathname;
    } else if (path instanceof Buffer) {
      partOfPath = path.toString();
    } else {
      partOfPath = path;
    }
    //const extension = substrAfterLast(partOfPath, ".") ?? "";
    foundMime = mime(partOfPath);
  } else {
    foundMime = mime ?? (mimeSniffing ?? true ? null : "application/octet-stream");
  }
  if ((parsedRanges?.length ?? 1) === 1) {
    if (foundMime) {
      response.setHeader("Content-Type", foundMime);
    }
    if (parsedRanges) {
      response.setHeader();
    }
  }
}
