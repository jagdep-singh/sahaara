import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Lang = "hi" | "en"

const languages: Array<{ code: Lang; label: string }> = [
  { code: "hi", label: "हिन्दी" },
  { code: "en", label: "English" },
]

type LangToggleProps = {
  lang: Lang
  path?: string
}

function LangToggle({ lang, path = "/" }: LangToggleProps) {
  const suffix = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`

  return (
    <nav
      aria-label="भाषा"
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1"
    >
      {languages.map((language) => {
        const isActive = language.code === lang

        return (
          <Link
            key={language.code}
            href={`/${language.code}${suffix}`}
            hrefLang={language.code}
            lang={language.code}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: isActive ? "default" : "ghost" }),
              "px-3"
            )}
          >
            {language.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { LangToggle, type Lang }
