'use server';

import { randomUUID } from 'node:crypto';

import { redirect } from 'next/navigation';

import type { Lang } from '@/i18n';
import {
  makeSignatureHeader,
  processPaymentEvent,
  PaymentError,
} from '@/lib/payments';

export type MockPaymentOutcome = 'success' | 'declined' | 'foreign';

export async function simulatePayment(
  lang: Lang,
  donationId: string,
  outcome: MockPaymentOutcome
) {
  const event = {
    eventId: randomUUID(),
    type:
      outcome === 'declined'
        ? ('payment.failed' as const)
        : ('payment.succeeded' as const),
    donationId,
    paymentRef: `MOCK-${randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`,
    cardCountry: outcome === 'foreign' ? 'US' : 'IN',
  };
  const rawBody = JSON.stringify(event);
  const secret = process.env.MOCK_WEBHOOK_SECRET;
  let destination = `/${lang}/donate/pay/${donationId}?result=error`;

  try {
    if (!secret) throw new Error('MOCK_WEBHOOK_SECRET must be set');

    const result = await processPaymentEvent(
      rawBody,
      makeSignatureHeader(secret, rawBody)
    );

    destination =
      result.result === 'PAID'
        ? `/${lang}/receipt/${result.receiptToken}`
        : `/${lang}/donate/pay/${donationId}?result=${
            result.result === 'FAILED' ? 'declined' : 'foreign'
          }`;
  } catch (error) {
    console.error(
      '[mock-payment] processing failed',
      error instanceof PaymentError ? error.code : 'INTERNAL'
    );
  }

  redirect(destination);
}
