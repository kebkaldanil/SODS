import { Dict, processFunction, RequestObject } from ".";
import { resultProcessor, current, onError, fromThere } from "..";

export type RouteLeaf<TResult = void> = processFunction<TResult> | {
  [method: string]: processFunction<TResult>,
} & {
  HEAD?: processFunction<TResult>,
  GET?: processFunction<TResult>,
  POST?: processFunction<TResult>,
  PUT?: processFunction<TResult>,
  DELETE?: processFunction<TResult>,
  OPTIONS?: processFunction<TResult>,
};

interface IResultProcessor<TSource, TResult> {
  [resultProcessor](obj: TSource, o: RequestObject): TResult;
}

export type RouteBranch<TSource = void, TResult = TSource> = (TResult extends string ? TResult : never) | processFunction<TResult> | Dict<RouteBranch<unknown, TSource>> & {
  [current]?: RouteLeaf<TResult>;
  [onError]?: (e: Error | { code: number }, o: RequestObject) => TResult;
  [fromThere]?: (o: RequestObject, path: string, declaredPath: string) => void;
} & TSource extends TResult ? Partial<IResultProcessor<TSource, TResult>> : IResultProcessor<TSource, TResult>;

export type RoutePart<TSource = void, TResult = TSource> = RouteBranch<TSource, TResult> | RouteLeaf<TResult>;
