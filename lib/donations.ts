import { prisma } from '@/lib/db';
import { CONSENT_VERSION } from '@/lib/constants';
import { rupeesToPaise } from '@/lib/money';
import type { DonationInput } from '@/lib/validators';

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

async function upsertDonor(input: DonationInput, now: Date) {
  try {
    return await prisma.donor.upsert({
      where: { email: input.email },
      update: {
        name: input.name,
        phone: input.phone ?? null,
        pan: input.pan,
        consentAt: now,
        consentVersion: CONSENT_VERSION,
      },
      create: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        pan: input.pan,
        consentAt: now,
        consentVersion: CONSENT_VERSION,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return prisma.donor.findUniqueOrThrow({
        where: { email: input.email },
      });
    }

    throw error;
  }
}

export async function createDonationRecord(
  input: DonationInput,
  campaignId: string | null = null
) {
  const existing = await prisma.donation.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) return existing;

  const donor = await upsertDonor(input, new Date());

  try {
    return await prisma.donation.create({
      data: {
        donorId: donor.id,
        campaignId,
        amountPaise: rupeesToPaise(input.amountRupees),
        type: input.type,
        idempotencyKey: input.idempotencyKey,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const raced = await prisma.donation.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (raced) return raced;
    }

    throw error;
  }
}
