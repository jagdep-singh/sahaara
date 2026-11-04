import type { hi } from "./hi";

type WidenStrings<T> = {
  [K in keyof T]: T[K] extends string ? string : WidenStrings<T[K]>;
};

export type Dictionary = WidenStrings<typeof hi>;
