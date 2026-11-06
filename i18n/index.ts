import { en } from "./en";
import { hi } from "./hi";
import type { Dictionary } from "./types";

export type { Dictionary } from "./types";

export type Lang = "hi" | "en";

export const LANGS = ["hi", "en"] as const;

export const DEFAULT_LANG: Lang = "hi";

export function isLang(value: string | undefined): value is Lang {
  return value === "hi" || value === "en";
}

const dictionaries: Record<Lang, Dictionary> = { hi, en };

export function getDict(lang: Lang): Dictionary {
  return dictionaries[lang];
}

export function fmt(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}
