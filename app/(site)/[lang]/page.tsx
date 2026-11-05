import {
  ArrowRight,
  BookOpen,
  HandCoins,
  HeartPulse,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { LinkButton } from "@/components/ui/link-button";
import { Notice } from "@/components/ui/notice";
import {
  DISTRICTS,
  type District,
} from "@/lib/constants";
import type { Need } from "@/lib/generated/prisma/enums";
import {
  getPublishedSchemes,
  type PublishedScheme,
} from "@/lib/schemes";
import { cn } from "@/lib/utils";
import { getDict, type Dictionary, type Lang } from "@/i18n";

const NEED_TILES = [
  { key: "PENSION", Icon: HandCoins },
  { key: "LIVELIHOOD", Icon: Sprout },
  { key: "HEALTH", Icon: HeartPulse },
  { key: "EDUCATION", Icon: BookOpen },
] as const satisfies ReadonlyArray<{ key: Need; Icon: LucideIcon }>;

type HomePageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    need?: string | string[];
    district?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function queryHref(
  path: string,
  params: { need?: string; district?: string }
) {
  const search = new URLSearchParams();

  if (params.need) search.set("need", params.need);
  if (params.district) search.set("district", params.district);

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

function SchemeCard({
  scheme,
  lang,
  dict,
  district,
}: {
  scheme: PublishedScheme;
  lang: Lang;
  dict: Dictionary;
  district?: District;
}) {
  const Icon = NEED_TILES.find((tile) => tile.key === scheme.need)?.Icon;
  const href = queryHref(`/${lang}/schemes/${scheme.slug}`, { district });

  return (
    <Link
      href={href}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-shadow group-hover:ring-primary/60">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {Icon ? (
              <Chip className="gap-1.5">
                <Icon aria-hidden="true" />
                {dict.need[scheme.need]}
              </Chip>
            ) : (
              <Chip>{dict.need[scheme.need]}</Chip>
            )}
          </div>
          <h3 className="text-lg leading-snug font-bold">
            {scheme.content.title}
          </h3>
          <p className="line-clamp-1 text-base text-muted-foreground">
            {scheme.content.benefit}
          </p>
        </CardHeader>
        <CardFooter className="justify-between border-t-0 bg-transparent pt-0">
          <span className="font-bold text-primary">{dict.home.view}</span>
          <ArrowRight aria-hidden="true" />
        </CardFooter>
      </Card>
    </Link>
  );
}

export default async function HomePage({
  params,
  searchParams,
}: HomePageProps) {
  const [{ lang: rawLang }, query] = await Promise.all([params, searchParams]);
  const lang: Lang = rawLang === "en" ? "en" : "hi";
  const dict = getDict(lang);

  const need = NEED_TILES.find(
    (tile) => tile.key === firstParam(query.need)
  )?.key;
  const district = DISTRICTS.find(
    (value) => value === firstParam(query.district)
  );

  const schemes = await getPublishedSchemes({ need, district, lang });
  const allNeedsHref = queryHref(`/${lang}`, { district });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6">
      <header className="flex flex-col gap-4">
        <h1>{dict.home.title}</h1>
        <div className="flex flex-col gap-2">
          <LinkButton
            href={`/${lang}/eligibility`}
            size="lg"
            className="w-full sm:w-fit"
          >
            {dict.home.finderCta}
          </LinkButton>
          <p className="text-base text-muted-foreground">
            {dict.home.finderHint}
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl">{dict.home.orBrowse}</h2>
          <Link
            href={allNeedsHref}
            className={cn(
              "rounded-md text-base underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50",
              need
                ? "text-muted-foreground underline hover:text-foreground"
                : "font-bold text-primary"
            )}
            aria-current={need ? undefined : "true"}
          >
            {dict.home.allNeeds}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {NEED_TILES.map(({ key, Icon }) => {
            const selected = need === key;

            return (
              <Link
                key={key}
                href={queryHref(`/${lang}`, { need: key, district })}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "flex min-h-24 flex-col items-start justify-between gap-3 rounded-xl border-2 bg-card p-4 transition-colors hover:border-primary/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <Icon aria-hidden="true" className="size-7 text-primary" />
                <span className="text-lg font-bold">{dict.need[key]}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <form
        method="get"
        action={`/${lang}`}
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      >
        {need ? <input type="hidden" name="need" value={need} /> : null}
        <label htmlFor="home-district" className="text-lg font-bold">
          {dict.home.districtLabel}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            id="home-district"
            name="district"
            defaultValue={district ?? ""}
            className="h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">{dict.home.allDistricts}</option>
            {DISTRICTS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <Button type="submit" className="sm:w-auto">
            {dict.home.show}
          </Button>
        </div>
      </form>

      <section className="flex flex-col gap-4">
        <h2>{dict.home.schemesHeading}</h2>
        {schemes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {schemes.map((scheme) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                lang={lang}
                dict={dict}
                district={district}
              />
            ))}
          </div>
        ) : (
          <Notice tone="info" title={dict.home.empty}>
            <div className="flex flex-col gap-3">
              <p>{dict.home.emptyHelp}</p>
              <Link
                href={`/${lang}/eligibility#callback`}
                className="w-fit font-bold text-primary underline underline-offset-4"
              >
                {dict.callback.title}
              </Link>
            </div>
          </Notice>
        )}
      </section>

      <section className="rounded-xl bg-brand-accent p-5 text-brand-accent-foreground">
        <h2 className="text-2xl">{dict.home.donateTitle}</h2>
        <p className="mt-2 text-base">{dict.home.donateText}</p>
        <LinkButton
          href={`/${lang}/donate`}
          variant="secondary"
          className="mt-4"
        >
          {dict.common.donate}
        </LinkButton>
      </section>
    </div>
  );
}
