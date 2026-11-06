import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { Notice } from '@/components/ui/notice';
import { Card, CardContent } from '@/components/ui/card';
import { getDict, type Lang } from '@/i18n';
import { prisma } from '@/lib/db';
import { formatINR } from '@/lib/money';

import { simulatePayment } from './actions';
import { PayButton } from './pay-button';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type PayPageProps = {
  params: Promise<{ lang: string; id: string }>;
  searchParams: Promise<{ result?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PayPage({
  params,
  searchParams,
}: PayPageProps) {
  const [{ lang: rawLang, id }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const lang: Lang = rawLang === 'en' ? 'en' : 'hi';
  const dict = getDict(lang);

  const donation = await prisma.donation.findUnique({
    where: { id },
    include: { receipt: true, campaign: true },
  });
  if (!donation) notFound();

  if (donation.status === 'PAID' && donation.receipt) {
    redirect(`/${lang}/receipt/${donation.receipt.publicToken}`);
  }

  const result = firstParam(query.result);
  const campaignTitle = donation.campaign
    ? lang === 'hi'
      ? donation.campaign.titleHi
      : donation.campaign.titleEn
    : dict.donate.general;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <h1>{dict.donate.step3}</h1>

      <Notice tone="warning">{dict.donate.testBanner}</Notice>

      {result === 'declined' ? (
        <Notice tone="error">{dict.donate.declinedNotice}</Notice>
      ) : null}
      {result === 'foreign' ? (
        <Notice tone="error">{dict.donate.foreignNotice}</Notice>
      ) : null}
      {result === 'error' ? (
        <Notice tone="error">{dict.common.error}</Notice>
      ) : null}

      <Card>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-base text-muted-foreground">
                {dict.donate.amount}
              </dt>
              <dd className="text-lg font-bold">
                {formatINR(donation.amountPaise)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-base text-muted-foreground">
                {dict.donate.frequency}
              </dt>
              <dd className="text-lg font-bold">
                {donation.type === 'MONTHLY'
                  ? dict.donate.monthly
                  : dict.donate.oneTime}
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <dt className="text-base text-muted-foreground">
                {dict.donate.campaign}
              </dt>
              <dd className="text-lg font-bold">{campaignTitle}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <form
          action={simulatePayment.bind(
            null,
            lang,
            donation.id,
            'success'
          )}
        >
          <PayButton
            label={dict.donate.testSuccess}
            variant="default"
          />
        </form>

        <form
          action={simulatePayment.bind(
            null,
            lang,
            donation.id,
            'declined'
          )}
        >
          <PayButton label={dict.donate.testDeclined} />
        </form>

        <form
          action={simulatePayment.bind(
            null,
            lang,
            donation.id,
            'foreign'
          )}
        >
          <PayButton label={dict.donate.testForeign} />
        </form>
      </div>
    </div>
  );
}
