import type { Lang } from '@/i18n';
import { prisma } from '@/lib/db';
import type { Prisma } from '@/lib/generated/prisma/client';
import type { Need } from '@/lib/generated/prisma/enums';

type SchemeWithContents = Prisma.SchemeGetPayload<{
  include: { contents: true };
}>;

export type SchemeContent = SchemeWithContents['contents'][number];
export type PublishedScheme = SchemeWithContents & { content: SchemeContent };

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_AFTER_DAYS = 90;

const DATE_LOCALES: Record<Lang, string> = {
  hi: 'hi-IN',
  en: 'en-IN',
};

export function pickContent(
  scheme: Pick<SchemeWithContents, 'contents'>,
  lang: Lang
): SchemeContent | undefined {
  const hindi = scheme.contents.find(
    (content) => content.lang === 'hi' && content.status === 'APPROVED'
  );

  if (lang === 'hi') {
    return hindi;
  }

  return (
    scheme.contents.find(
      (content) => content.lang === 'en' && content.status === 'APPROVED'
    ) ?? hindi
  );
}

function withContent(
  scheme: SchemeWithContents,
  lang: Lang
): PublishedScheme {
  const content = pickContent(scheme, lang);

  if (!content) {
    throw new Error(`Scheme ${scheme.code} has no approved Hindi content`);
  }

  return { ...scheme, content };
}

export async function getPublishedSchemes({
  need,
  district,
  lang,
}: {
  need?: Need;
  district?: string;
  lang: Lang;
}): Promise<PublishedScheme[]> {
  const where: Prisma.SchemeWhereInput = {
    publishedAt: { not: null },
    contents: {
      some: {
        lang: 'hi',
        status: 'APPROVED',
      },
    },
  };

  if (need) {
    where.need = need;
  }

  if (district) {
    where.OR = [
      { districts: { isEmpty: true } },
      { districts: { has: district } },
    ];
  }

  const schemes = await prisma.scheme.findMany({
    where,
    include: { contents: true },
    orderBy: [{ need: 'asc' }, { code: 'asc' }],
  });

  return schemes.map((scheme) => withContent(scheme, lang));
}

export async function getSchemeBySlug(
  slug: string,
  lang: Lang
): Promise<PublishedScheme | null> {
  const scheme = await prisma.scheme.findFirst({
    where: {
      slug,
      publishedAt: { not: null },
      contents: {
        some: {
          lang: 'hi',
          status: 'APPROVED',
        },
      },
    },
    include: { contents: true },
  });

  return scheme ? withContent(scheme, lang) : null;
}

export async function getHelpCentres(districts: string[]) {
  return prisma.helpCentre.findMany({
    where: districts.length > 0 ? { district: { in: districts } } : undefined,
    orderBy: [{ district: 'asc' }, { name: 'asc' }],
  });
}

export function isStale(lastCheckedAt: Date) {
  return Date.now() - lastCheckedAt.getTime() > STALE_AFTER_DAYS * DAY_MS;
}

export function formatDate(date: Date, lang: Lang) {
  return date.toLocaleDateString(DATE_LOCALES[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

export function formatDateHi(date: Date) {
  return formatDate(date, 'hi');
}
