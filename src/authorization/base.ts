import { processFunction } from "../core/types";
import crypto from "crypto";

let lastSize = 16;
let lastValue = ;

export const token = {
    withLength(length = lastSize) {}
};

export interface Authorization {
    authorize(): processFunction;
}
