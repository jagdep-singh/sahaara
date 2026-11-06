import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Card, CardContent } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';
import { Notice } from '@/components/ui/notice';
import { getDict, type Lang } from '@/i18n';
import { prisma } from '@/lib/db';
import { formatINR } from '@/lib/money';
import { formatDate } from '@/lib/schemes';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type ReceiptPageProps = {
  params: Promise<{ lang: string; token: string }>;
};

export default async function ReceiptPage({
  params,
}: ReceiptPageProps) {
  const { lang: rawLang, token } = await params;
  const lang: Lang = rawLang === 'en' ? 'en' : 'hi';
  const dict = getDict(lang);

  const receipt = await prisma.receipt.findUnique({
    where: { publicToken: token },
    include: { donation: true },
  });
  if (!receipt) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <h1>{dict.receipt.title}</h1>

      <Notice tone="success">{dict.receipt.thanks}</Notice>

      <Card>
        <CardContent>
          <dl className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-base text-muted-foreground">
                {dict.receipt.number}
              </dt>
              <dd className="text-3xl font-bold break-words">
                {receipt.number}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-base text-muted-foreground">
                {dict.donate.name}
              </dt>
              <dd className="text-lg font-bold">{receipt.donorName}</dd>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <dt className="text-base text-muted-foreground">
                  {dict.receipt.amount}
                </dt>
                <dd className="text-lg font-bold">
                  {formatINR(receipt.amountPaise)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-base text-muted-foreground">
                  {dict.receipt.date}
                </dt>
                <dd className="text-lg font-bold">
                  {formatDate(receipt.issuedAt, lang)}
                </dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      <LinkButton
        href={`/api/receipts/${token}/pdf`}
        size="lg"
        className="w-full sm:w-auto"
      >
        {dict.receipt.download}
      </LinkButton>

      {receipt.donation.type === 'MONTHLY' ? (
        <Notice tone="info">{dict.receipt.monthlyNote}</Notice>
      ) : null}
    </div>
  );
}
