import { randomUUID } from 'node:crypto';

import { prisma } from '@/lib/db';
import type {
  DonationStatus,
  DonationType,
} from '@/lib/generated/prisma/client';

const TABLES = [
  'receipt',
  'receipt_counter',
  'webhook_event',
  'recurring_plan',
  'donation',
  'donor',
  'campaign',
  'callback_request',
  'finder_use',
  'audit_log',
  'scheme_content',
  'scheme',
  'help_centre',
  'app_user',
].join(', ');

export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES} RESTART IDENTITY CASCADE`,
  );
}

type DonorInput = {
  name?: string;
  email?: string;
  pan?: string;
};

export async function makeDonor(overrides: DonorInput = {}) {
  return prisma.donor.create({
    data: {
      name: overrides.name ?? 'Test Donor',
      email:
        overrides.email ?? `donor-${randomUUID()}@example.org`,
      pan: overrides.pan ?? 'ZZZZZ0001Z',
      consentAt: new Date(),
      consentVersion: 'v1',
    },
  });
}

type DonationInput = {
  amountPaise?: number;
  type?: DonationType;
  name?: string;
  donorId?: string;
  campaignId?: string;
  paidAt?: Date;
};

async function makeDonation(
  status: DonationStatus,
  overrides: DonationInput = {}
) {
  const donorId =
    overrides.donorId ??
    (await makeDonor({ name: overrides.name })).id;

  return prisma.donation.create({
    data: {
      donorId,
      campaignId: overrides.campaignId,
      amountPaise: overrides.amountPaise ?? 50_000,
      type: overrides.type ?? 'ONE_TIME',
      status,
      idempotencyKey: randomUUID(),
      paidAt:
        status === 'PAID' ? overrides.paidAt ?? new Date() : null,
    },
  });
}

export function makePaidDonation(overrides: DonationInput = {}) {
  return makeDonation('PAID', overrides);
}

export function makePendingDonation(overrides: DonationInput = {}) {
  return makeDonation('PENDING', overrides);
}
