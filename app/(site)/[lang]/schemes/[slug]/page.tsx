import Link from "next/link";
import { notFound } from "next/navigation";

import { Chip } from "@/components/ui/chip";
import { LinkButton } from "@/components/ui/link-button";
import { Notice } from "@/components/ui/notice";
import { DISTRICTS, type District } from "@/lib/constants";
import {
  formatDate,
  getHelpCentres,
  getSchemeBySlug,
  isStale,
} from "@/lib/schemes";
import { getDict, type Lang } from "@/i18n";

type SchemePageProps = {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{ district?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function withSelectedDistrictFirst(
  centres: Awaited<ReturnType<typeof getHelpCentres>>,
  district?: District
) {
  if (!district) return centres;

  return [...centres].sort(
    (a, b) =>
      Number(b.district === district) - Number(a.district === district)
  );
}

export default async function SchemePage({
  params,
  searchParams,
}: SchemePageProps) {
  const [{ lang: rawLang, slug }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const lang: Lang = rawLang === "en" ? "en" : "hi";
  const dict = getDict(lang);

  const scheme = await getSchemeBySlug(slug, lang);
  if (!scheme) notFound();

  const district = DISTRICTS.find(
    (value) => value === firstParam(query.district)
  );
  const centres = withSelectedDistrictFirst(
    await getHelpCentres(scheme.districts),
    district
  );
  const stale = isStale(scheme.lastCheckedAt);
  const usedFallback = lang === "en" && scheme.content.lang === "hi";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6">
      <header className="flex flex-col gap-3">
        <h1>{scheme.content.title}</h1>
        <Chip className="w-fit">{dict.need[scheme.need]}</Chip>
      </header>

      {usedFallback ? (
        <Notice tone="info">{dict.scheme.fallbackNote}</Notice>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2>{dict.scheme.benefit}</h2>
        <p>{scheme.content.benefit}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>{dict.scheme.who}</h2>
        <p>{scheme.content.whoCanApply}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>{dict.scheme.documents}</h2>
        <ul className="list-disc space-y-2 pl-6">
          {scheme.content.documents.map((document) => (
            <li key={document}>{document}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2>{dict.scheme.how}</h2>
        <p>{scheme.content.howToApply}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>{dict.scheme.help}</h2>
        <ul className="flex flex-col gap-3">
          {centres.map((centre) => (
            <li
              key={centre.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="font-bold">{centre.name}</p>
              <p className="text-base text-muted-foreground">
                {centre.address}
              </p>
              <a
                href={telHref(centre.phone)}
                className="mt-1 inline-block font-bold text-primary underline underline-offset-4"
              >
                {centre.phone}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <Link
          href={scheme.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit font-bold text-primary underline underline-offset-4"
        >
          {dict.scheme.source}
        </Link>
        <p className="text-base text-muted-foreground">
          {dict.scheme.lastChecked}:{" "}
          {formatDate(scheme.lastCheckedAt, lang)}
        </p>
      </section>

      {stale ? <Notice tone="warning">{dict.scheme.stale}</Notice> : null}

      <LinkButton
        href={`/${lang}/eligibility`}
        size="lg"
        className="w-full sm:w-fit"
      >
        {dict.scheme.checkEligibility}
      </LinkButton>
    </div>
  );
}
