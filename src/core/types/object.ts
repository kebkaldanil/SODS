// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KeyOfAny = keyof any;

export type JsonPart = Dict<JsonPart> | string | number | boolean | JsonPart[];

export type Getters<T extends object, K extends KeyOfAny = keyof T> = {
  [Key in Extract<K, keyof T>]: () => T[Key]
};

export interface ReadonlyDict<T> {
  readonly [key: string]: T;
}

export interface Dict<T> {
  [key: string]: T
};

export type JsonCopy<T> = (
  T extends JsonPart ?
    T
    : T extends readonly unknown[] ?
      {
        -readonly [Index in keyof T]: JsonCopy<T[Index]>;
      }
      : T extends ReadonlyDict<unknown> ?
        {
          -readonly [Key in Extract<keyof T, string> as JsonCopy<T[Key]> extends null ? never : Key]: JsonCopy<T[Key]>;
        }
        : null
);
