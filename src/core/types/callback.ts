import { RequestObject } from ".";

export type processFunction<TResult = unknown> = (o: RequestObject, path: string) => TResult | Promise<TResult>;
