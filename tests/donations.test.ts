import { randomUUID } from 'node:crypto';

import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { prisma } from '@/lib/db';
import { createDonationRecord } from '@/lib/donations';
import type { DonationInput } from '@/lib/validators';
import { resetDb } from '@/tests/helpers/db';

beforeEach(async () => {
  await resetDb();
});

describe('createDonationRecord', () => {
  it('creates one donation when the same key is submitted twice in parallel', async () => {
    const input: DonationInput = {
      amountRupees: 500,
      type: 'ONE_TIME',
      name: 'Sunita Devi',
      email: `sunita-${randomUUID()}@example.org`,
      pan: 'ABCDE1234F',
      consent: true,
      idempotencyKey: randomUUID(),
    };

    const [first, second] = await Promise.all([
      createDonationRecord(input),
      createDonationRecord(input),
    ]);

    expect(first.id).toBe(second.id);
    expect(await prisma.donation.count()).toBe(1);
    expect(await prisma.donor.count()).toBe(1);

    const donation = await prisma.donation.findUniqueOrThrow({
      where: { id: first.id },
    });
    expect(donation.amountPaise).toBe(50_000);
    expect(donation.status).toBe('PENDING');
    expect(donation.type).toBe('ONE_TIME');
    expect(donation.idempotencyKey).toBe(input.idempotencyKey);

    const donor = await prisma.donor.findUniqueOrThrow({
      where: { email: input.email },
    });
    expect(donor.name).toBe(input.name);
    expect(donor.pan).toBe(input.pan);
  });
});
