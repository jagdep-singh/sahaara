'use server';

import { headers } from 'next/headers';

import { getDict, isLang, type Lang } from '@/i18n';
import { prisma } from '@/lib/db';
import {
  matchSchemes,
  type Answers,
  type Match,
  type Rule,
} from '@/lib/eligibility';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { getPublishedSchemes } from '@/lib/schemes';
import {
  callbackInputSchema,
  finderAnswersSchema,
} from '@/lib/validators';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export type FinderMatch = {
  code: string;
  slug: string;
  title: string;
  benefit: string;
  status: Match['status'];
  results: Match['results'];
};

export type FinderResponse =
  | { ok: true; matches: FinderMatch[] }
  | { ok: false; error: string };

function todayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate())
  );
}

export async function runFinder(
  lang: string,
  answers: Answers
): Promise<FinderResponse> {
  const locale: Lang = isLang(lang) ? lang : 'hi';
  const dict = getDict(locale);
  const parsed = finderAnswersSchema.safeParse(answers);

  if (!parsed.success) {
    return { ok: false, error: dict.common.error };
  }

  const schemes = (await getPublishedSchemes({ lang: locale })).filter(
    (scheme) => Array.isArray(scheme.rules)
  );
  const matches = matchSchemes(
    schemes.map((scheme) => ({
      code: scheme.code,
      slug: scheme.slug,
      districts: scheme.districts,
      rules: scheme.rules as unknown as Rule[],
    })),
    parsed.data
  );

  await prisma.finderUse.create({
    data: {
      day: todayIST(),
      resultCount: matches.length,
    },
  });

  const bySlug = new Map(
    schemes.map((scheme) => [scheme.slug, scheme])
  );

  return {
    ok: true,
    matches: matches.flatMap((match) => {
      const scheme = bySlug.get(match.slug);
      if (!scheme) return [];

      return [
        {
          ...match,
          title: scheme.content.title,
          benefit: scheme.content.benefit,
        },
      ];
    }),
  };
}

export type CallbackFieldErrors = {
  name?: string;
  phone?: string;
  district?: string;
  consent?: string;
};

export type CallbackState = {
  success?: boolean;
  error?: string;
  fieldErrors?: CallbackFieldErrors;
};

const CALLBACK_RATE_LIMIT = 5;
const CALLBACK_RATE_WINDOW_MS = 10 * 60 * 1000;

export async function submitCallback(
  _prevState: CallbackState,
  formData: FormData
): Promise<CallbackState> {
  const rawLang = String(formData.get('lang') ?? '');
  const locale: Lang = isLang(rawLang) ? rawLang : 'hi';
  const dict = getDict(locale);
  const ip = clientIp((await headers()).get('x-forwarded-for'));

  if (
    !rateLimit(
      `callback:${ip}`,
      CALLBACK_RATE_LIMIT,
      CALLBACK_RATE_WINDOW_MS
    )
  ) {
    return { error: dict.callback.rateLimited };
  }

  const parsed = callbackInputSchema.safeParse({
    name: formData.get('name'),
    phone: String(formData.get('phone') ?? '').trim(),
    district: formData.get('district'),
    schemeCodes: formData.getAll('schemeCodes').map(String),
    consent: formData.get('consent') === 'on',
  });

  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    const fieldErrors: CallbackFieldErrors = {
      name: fields.name ? dict.common.required : undefined,
      phone: fields.phone ? dict.callback.phoneError : undefined,
      district: fields.district ? dict.common.required : undefined,
      consent: fields.consent ? dict.common.required : undefined,
    };

    return Object.values(fieldErrors).some(Boolean)
      ? { fieldErrors }
      : { error: dict.common.error };
  }

  try {
    await prisma.callbackRequest.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        district: parsed.data.district,
        schemeCodes: parsed.data.schemeCodes,
        consentAt: new Date(),
      },
    });
  } catch {
    console.error('[callback] insert failed');
    return { error: dict.common.error };
  }

  return { success: true };
}
