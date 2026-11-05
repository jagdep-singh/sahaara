import { randomBytes } from 'node:crypto';

import { prisma } from '@/lib/db';
import { financialYearIST, formatReceiptNumber } from '@/lib/fy';
import type { Prisma } from '@/lib/generated/prisma/client';

export type Tx = Prisma.TransactionClient;

export class ReceiptError extends Error {
  constructor(public code: 'NOT_FOUND' | 'NOT_PAID') {
    super(code);
  }
}

export const TX_OPTIONS = {
  maxWait: 30_000,
  timeout: 30_000,
} as const;

export async function issueReceiptTx(
  tx: Tx,
  donationId: string,
  opts: { now?: Date } = {}
) {
  const now = opts.now ?? new Date();

  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM donation WHERE id = ${donationId} FOR UPDATE
  `;
  if (locked.length === 0) throw new ReceiptError('NOT_FOUND');

  const existing = await tx.receipt.findUnique({
    where: { donationId },
  });
  if (existing) return existing;

  const donation = await tx.donation.findUniqueOrThrow({
    where: { id: donationId },
    include: { donor: true, campaign: true },
  });
  if (donation.status !== 'PAID') {
    throw new ReceiptError('NOT_PAID');
  }

  const fy = financialYearIST(now);
  const rows = await tx.$queryRaw<{ last_seq: number }[]>`
    INSERT INTO receipt_counter (fy, last_seq) VALUES (${fy}, 1)
    ON CONFLICT (fy) DO UPDATE
      SET last_seq = receipt_counter.last_seq + 1
    RETURNING last_seq
  `;
  const seq = rows[0].last_seq;

  return tx.receipt.create({
    data: {
      donationId,
      fy,
      seq,
      number: formatReceiptNumber(fy, seq),
      publicToken: randomBytes(24).toString('base64url'),
      donorName: donation.donor.name,
      donorPan: donation.donor.pan,
      amountPaise: donation.amountPaise,
      campaignTitle: donation.campaign?.titleEn ?? null,
      issuedAt: now,
    },
  });
}

export const issueReceipt = (
  donationId: string,
  opts: { now?: Date } = {}
) =>
  prisma.$transaction(
    (tx) => issueReceiptTx(tx, donationId, opts),
    TX_OPTIONS
  );
