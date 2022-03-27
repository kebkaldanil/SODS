import { processFunction } from "../core/types";
import crypto from "crypto";

const lastSize = 16;
//TODO
const lastValue = "";

export const token = {
  withLength(length = lastSize) {},
};

export interface Authorization {
  authorize(): processFunction;
}
