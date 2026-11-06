import { createHmac, timingSafeEqual } from 'node:crypto';

import { z } from 'zod';

import { prisma } from '@/lib/db';
import { issueReceiptTx, TX_OPTIONS } from '@/lib/receipts';

export const EventSchema = z.object({
  eventId: z.string().min(8).max(64),
  type: z.enum(['payment.succeeded', 'payment.failed']),
  donationId: z.string().min(1).max(64),
  paymentRef: z.string().min(1).max(64),
  cardCountry: z
    .string()
    .length(2)
    .transform((value) => value.toUpperCase()),
});

export type PaymentEvent = z.infer<typeof EventSchema>;

export const signPayload = (
  secret: string,
  t: number,
  rawBody: string
): string =>
  createHmac('sha256', secret)
    .update(`${t}.${rawBody}`)
    .digest('hex');

export const makeSignatureHeader = (
  secret: string,
  rawBody: string,
  t = Math.floor(Date.now() / 1000)
): string => `t=${t},v1=${signPayload(secret, t, rawBody)}`;

export class PaymentError extends Error {
  constructor(
    public code:
      | 'BAD_SIGNATURE'
      | 'STALE'
      | 'BAD_PAYLOAD'
      | 'NOT_FOUND'
  ) {
    super(code);
  }
}

export function verifySignature(
  secret: string,
  header: string | null,
  rawBody: string,
  nowMs = Date.now(),
  toleranceSec = 300
): void {
  const match = header?.match(/^t=(\d+),v1=([a-f0-9]{64})$/);
  if (!match) throw new PaymentError('BAD_SIGNATURE');

  const t = Number(match[1]);
  if (Math.abs(nowMs / 1000 - t) > toleranceSec) {
    throw new PaymentError('STALE');
  }

  const expected = Buffer.from(
    signPayload(secret, t, rawBody),
    'hex'
  );
  const received = Buffer.from(match[2], 'hex');

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new PaymentError('BAD_SIGNATURE');
  }
}

export type PaymentResult =
  | { result: 'PAID'; receiptToken: string; duplicate: boolean }
  | { result: 'FAILED' }
  | { result: 'BLOCKED_FOREIGN' };

function parseEvent(rawBody: string): PaymentEvent {
  let json: unknown;

  try {
    json = JSON.parse(rawBody);
  } catch {
    throw new PaymentError('BAD_PAYLOAD');
  }

  const parsed = EventSchema.safeParse(json);
  if (!parsed.success) throw new PaymentError('BAD_PAYLOAD');

  return parsed.data;
}

export async function processPaymentEvent(
  rawBody: string,
  signatureHeader: string | null,
  now = new Date()
): Promise<PaymentResult> {
  const secret = process.env.MOCK_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('MOCK_WEBHOOK_SECRET must be set');
  }

  verifySignature(secret, signatureHeader, rawBody);
  const event = parseEvent(rawBody);

  return prisma.$transaction(async (tx): Promise<PaymentResult> => {
    await tx.webhookEvent.createMany({
      data: [{ id: event.eventId }],
      skipDuplicates: true,
    });

    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM donation
      WHERE id = ${event.donationId}
      FOR UPDATE
    `;
    if (locked.length === 0) throw new PaymentError('NOT_FOUND');

    const donation = await tx.donation.findUniqueOrThrow({
      where: { id: event.donationId },
    });

    if (donation.status === 'PAID') {
      const existing = await tx.receipt.findUnique({
        where: { donationId: donation.id },
      });
      const receipt =
        existing ??
        (await issueReceiptTx(tx, donation.id, { now }));

      return {
        result: 'PAID',
        receiptToken: receipt.publicToken,
        duplicate: true,
      };
    }

    if (event.type === 'payment.failed') {
      await tx.donation.update({
        where: { id: donation.id },
        data: { status: 'FAILED' },
      });
      return { result: 'FAILED' };
    }

    if (event.cardCountry !== 'IN') {
      await tx.donation.update({
        where: { id: donation.id },
        data: { status: 'BLOCKED_FOREIGN' },
      });
      return { result: 'BLOCKED_FOREIGN' };
    }

    await tx.donation.update({
      where: { id: donation.id },
      data: {
        status: 'PAID',
        paidAt: now,
        paymentRef: event.paymentRef,
        cardCountry: event.cardCountry,
      },
    });

    if (donation.type === 'MONTHLY') {
      const nextRunOn = new Date(now);
      nextRunOn.setMonth(nextRunOn.getMonth() + 1);

      await tx.recurringPlan.create({
        data: {
          donorId: donation.donorId,
          amountPaise: donation.amountPaise,
          dayOfMonth: now.getDate(),
          nextRunOn,
        },
      });
    }

    const receipt = await issueReceiptTx(tx, donation.id, { now });

    return {
      result: 'PAID',
      receiptToken: receipt.publicToken,
      duplicate: false,
    };
  }, TX_OPTIONS);
}
