import { randomUUID } from 'node:crypto';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { POST } from '@/app/api/payments/webhook/route';
import { prisma } from '@/lib/db';
import { makeSignatureHeader } from '@/lib/payments';
import {
  makePendingDonation,
  resetDb,
} from '@/tests/helpers/db';

const secret = process.env.MOCK_WEBHOOK_SECRET ?? '';
if (!secret) throw new Error('MOCK_WEBHOOK_SECRET must be set');

function eventBody(
  overrides: {
    eventId?: string;
    type?: 'payment.succeeded' | 'payment.failed';
    donationId: string;
    paymentRef?: string;
    cardCountry?: string;
  }
) {
  return JSON.stringify({
    eventId: overrides.eventId ?? randomUUID(),
    type: overrides.type ?? 'payment.succeeded',
    donationId: overrides.donationId,
    paymentRef: overrides.paymentRef ?? `MOCK-${randomUUID()}`,
    cardCountry: overrides.cardCountry ?? 'IN',
  });
}

function webhookRequest(
  rawBody: string,
  options: { secret?: string; t?: number } = {}
) {
  const t = options.t ?? Math.floor(Date.now() / 1000);
  const signature = makeSignatureHeader(
    options.secret ?? secret,
    rawBody,
    t
  );

  return new Request('http://localhost/api/payments/webhook', {
    method: 'POST',
    headers: { 'x-webhook-signature': signature },
    body: rawBody,
  });
}

async function post(
  rawBody: string,
  options: { secret?: string; t?: number } = {}
) {
  return POST(webhookRequest(rawBody, options));
}

beforeEach(async () => {
  await resetDb();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('payment webhook', () => {
  it('rejects a bad signature without changing anything', async () => {
    const donation = await makePendingDonation();
    const rawBody = eventBody({ donationId: donation.id });

    const response = await post(rawBody, { secret: 'wrong-secret' });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'BAD_SIGNATURE',
    });

    const fresh = await prisma.donation.findUniqueOrThrow({
      where: { id: donation.id },
    });
    expect(fresh.status).toBe('PENDING');
    expect(await prisma.webhookEvent.count()).toBe(0);
    expect(await prisma.receipt.count()).toBe(0);
    expect(await prisma.receiptCounter.count()).toBe(0);
  });

  it('rejects a stale signature without changing anything', async () => {
    const donation = await makePendingDonation();
    const rawBody = eventBody({ donationId: donation.id });

    const response = await post(rawBody, {
      t: Math.floor(Date.now() / 1000) - 301,
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'STALE' });

    const fresh = await prisma.donation.findUniqueOrThrow({
      where: { id: donation.id },
    });
    expect(fresh.status).toBe('PENDING');
    expect(await prisma.webhookEvent.count()).toBe(0);
    expect(await prisma.receipt.count()).toBe(0);
    expect(await prisma.receiptCounter.count()).toBe(0);
  });

  it('creates one receipt when the same event arrives five times in parallel', async () => {
    const donation = await makePendingDonation();
    const rawBody = eventBody({ donationId: donation.id });

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => post(rawBody))
    );
    const bodies = await Promise.all(
      responses.map((response) => response.json())
    );

    expect(responses.every((response) => response.status === 200)).toBe(
      true
    );
    expect(bodies.every((body) => body.result === 'PAID')).toBe(true);
    expect(bodies.filter((body) => body.duplicate === false)).toHaveLength(
      1
    );
    expect(
      new Set(bodies.map((body) => body.receiptToken)).size
    ).toBe(1);

    const fresh = await prisma.donation.findUniqueOrThrow({
      where: { id: donation.id },
    });
    expect(fresh.status).toBe('PAID');
    expect(await prisma.webhookEvent.count()).toBe(1);
    expect(await prisma.receipt.count()).toBe(1);

    const counter = await prisma.receiptCounter.findFirst();
    expect(counter?.lastSeq).toBe(1);
  });

  it('blocks a foreign card without issuing a receipt', async () => {
    const donation = await makePendingDonation();
    const rawBody = eventBody({
      donationId: donation.id,
      cardCountry: 'US',
    });

    const response = await post(rawBody);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      result: 'BLOCKED_FOREIGN',
    });

    const fresh = await prisma.donation.findUniqueOrThrow({
      where: { id: donation.id },
    });
    expect(fresh.status).toBe('BLOCKED_FOREIGN');
    expect(await prisma.webhookEvent.count()).toBe(1);
    expect(await prisma.receipt.count()).toBe(0);
    expect(await prisma.receiptCounter.count()).toBe(0);
  });

  it('marks a declined payment as failed', async () => {
    const donation = await makePendingDonation();
    const rawBody = eventBody({
      donationId: donation.id,
      type: 'payment.failed',
    });

    const response = await post(rawBody);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: 'FAILED' });

    const fresh = await prisma.donation.findUniqueOrThrow({
      where: { id: donation.id },
    });
    expect(fresh.status).toBe('FAILED');
    expect(await prisma.receipt.count()).toBe(0);
    expect(await prisma.receiptCounter.count()).toBe(0);
  });

  it('issues exactly one receipt when a failed payment is retried successfully', async () => {
    const donation = await makePendingDonation();

    const failed = await post(
      eventBody({
        donationId: donation.id,
        type: 'payment.failed',
      })
    );
    expect(await failed.json()).toEqual({ result: 'FAILED' });

    const succeeded = await post(
      eventBody({ donationId: donation.id })
    );
    expect(await succeeded.json()).toMatchObject({
      result: 'PAID',
      duplicate: false,
    });

    const fresh = await prisma.donation.findUniqueOrThrow({
      where: { id: donation.id },
    });
    expect(fresh.status).toBe('PAID');
    expect(fresh.paidAt).not.toBeNull();
    expect(await prisma.webhookEvent.count()).toBe(2);
    expect(await prisma.receipt.count()).toBe(1);

    const counter = await prisma.receiptCounter.findFirst();
    expect(counter?.lastSeq).toBe(1);
  });

  it('creates one recurring plan for a monthly payment', async () => {
    const donation = await makePendingDonation({
      type: 'MONTHLY',
      amountPaise: 100_000,
    });
    const now = new Date('2026-09-15T12:00:00.000Z');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);

    const response = await post(
      eventBody({ donationId: donation.id })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ result: 'PAID' });

    const plans = await prisma.recurringPlan.findMany();
    expect(plans).toHaveLength(1);
    expect(plans[0].dayOfMonth).toBe(15);
    expect(plans[0].amountPaise).toBe(100_000);
    expect(plans[0].nextRunOn.getMonth()).toBe(9);
    expect(plans[0].nextRunOn.getDate()).toBe(15);
  });
});
