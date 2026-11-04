import Link from "next/link";

import { LangToggle } from "@/components/lang-toggle";
import { LinkButton } from "@/components/ui/link-button";
import type { Dictionary, Lang } from "@/i18n";

type SiteHeaderProps = {
  lang: Lang;
  dict: Dictionary;
  path: string;
};

export function SiteHeader({ lang, dict, path }: SiteHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link
          href={`/${lang}`}
          className="rounded-md text-xl font-bold tracking-tight [font-family:var(--font-deva)]"
        >
          {dict.site.name}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <LangToggle
            lang={lang}
            path={path}
            labels={{
              hi: dict.common.lang.hi,
              en: dict.common.lang.en,
              aria: dict.common.language,
            }}
          />

          <LinkButton href={`/${lang}/donate`} className="px-4">
            {dict.common.donate}
          </LinkButton>
        </div>
      </div>
    </header>
  );
}
