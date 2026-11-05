"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { Lang } from "@/i18n";
import { cn } from "@/lib/utils";

type LangToggleLabels = {
  hi: string;
  en: string;
  aria: string;
};

type LangToggleProps = {
  lang: Lang;
  labels?: LangToggleLabels;
};

const defaultLabels: LangToggleLabels = {
  hi: "हिन्दी",
  en: "English",
  aria: "भाषा",
};

const languages = [{ code: "hi" }, { code: "en" }] as const;

function LangToggle({ lang, labels = defaultLabels }: LangToggleProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathWithoutLang = pathname.replace(/^\/(?:hi|en)(?=\/|$)/, "");
  const suffix = pathWithoutLang === "" ? "" : pathWithoutLang;
  const query = searchParams.toString();
  const search = query ? `?${query}` : "";
  const activeIndex = languages.findIndex((language) => language.code === lang);

  return (
    <nav
      aria-label={labels.aria}
      className="relative inline-grid grid-cols-2 rounded-full border border-border/60 bg-muted/40 p-0.5 text-[13px]"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-background shadow-sm ring-1 ring-border/50",
          "transition-transform duration-300 ease-out motion-reduce:transition-none",
          activeIndex === 1 ? "translate-x-full" : "translate-x-0"
        )}
      />
      {languages.map((language) => {
        const isActive = language.code === lang;

        return (
          <Link
            key={language.code}
            href={`/${language.code}${suffix}${search}`}
            hrefLang={language.code}
            lang={language.code}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative z-10 rounded-full px-4 py-1.5 text-center transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {labels[language.code]}
          </Link>
        );
      })}
    </nav>
  );
}

export { LangToggle, type Lang };
