import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@/lib/db';
import {
  issueReceipt,
  issueReceiptTx,
  TX_OPTIONS,
} from '@/lib/receipts';
import {
  makeDonor,
  makePaidDonation,
  makePendingDonation,
  resetDb,
} from '@/tests/helpers/db';

const NOW = new Date('2026-09-05T00:00:00.000Z');
const FY = '2026-27';

beforeEach(async () => {
  await resetDb();
});

describe('issueReceipt', () => {
  it('issues 200 parallel receipts with gapless unique numbers', async () => {
    const donor = await makeDonor();
    const donations = await Promise.all(
      Array.from({ length: 200 }, (_, index) =>
        makePaidDonation({
          donorId: donor.id,
          amountPaise: 50_000 + index,
        })
      )
    );

    const receipts = await Promise.all(
      donations.map((donation) =>
        issueReceipt(donation.id, { now: NOW })
      )
    );

    expect(receipts).toHaveLength(200);
    expect(receipts.every((receipt) => receipt.fy === FY)).toBe(true);
    expect(
      receipts.map((receipt) => receipt.seq).sort((a, b) => a - b)
    ).toEqual(Array.from({ length: 200 }, (_, index) => index + 1));
    expect(new Set(receipts.map((receipt) => receipt.number)).size).toBe(
      200
    );

    const counter = await prisma.receiptCounter.findUnique({
      where: { fy: FY },
    });
    expect(counter?.lastSeq).toBe(200);
    expect(await prisma.receipt.count()).toBe(200);
  });

  it('returns one receipt for 10 parallel issues of the same donation', async () => {
    const donation = await makePaidDonation();

    const receipts = await Promise.all(
      Array.from({ length: 10 }, () =>
        issueReceipt(donation.id, { now: NOW })
      )
    );

    expect(new Set(receipts.map((receipt) => receipt.id)).size).toBe(1);
    expect(
      new Set(receipts.map((receipt) => receipt.number)).size
    ).toBe(1);

    const counter = await prisma.receiptCounter.findUnique({
      where: { fy: FY },
    });
    expect(counter?.lastSeq).toBe(1);
    expect(await prisma.receipt.count()).toBe(1);
  });

  it('rolls back both the receipt and counter when the transaction fails', async () => {
    const donation = await makePaidDonation();

    await expect(
      prisma.$transaction(async (tx) => {
        await issueReceiptTx(tx, donation.id, { now: NOW });
        throw new Error('boom');
      }, TX_OPTIONS)
    ).rejects.toThrow('boom');

    expect(await prisma.receipt.count()).toBe(0);
    expect(
      await prisma.receiptCounter.findUnique({ where: { fy: FY } })
    ).toBeNull();

    const receipt = await issueReceipt(donation.id, { now: NOW });
    expect(receipt.seq).toBe(1);
  });

  it('uses separate counters at the IST financial-year boundary', async () => {
    const donor = await makeDonor();
    const before = await makePaidDonation({ donorId: donor.id });
    const after = await makePaidDonation({ donorId: donor.id });

    const lastSecond = await issueReceipt(before.id, {
      now: new Date('2026-03-31T18:29:59.000Z'),
    });
    const firstSecond = await issueReceipt(after.id, {
      now: new Date('2026-03-31T18:30:00.000Z'),
    });

    expect(lastSecond.fy).toBe('2025-26');
    expect(lastSecond.seq).toBe(1);
    expect(firstSecond.fy).toBe('2026-27');
    expect(firstSecond.seq).toBe(1);
    expect(lastSecond.number).not.toBe(firstSecond.number);

    const counters = await prisma.receiptCounter.findMany();
    expect(
      Object.fromEntries(
        counters.map((counter) => [counter.fy, counter.lastSeq])
      )
    ).toEqual({ '2025-26': 1, '2026-27': 1 });
  });

  it('rejects unpaid donations without consuming a number', async () => {
    const pending = await makePendingDonation();

    await expect(
      issueReceipt(pending.id, { now: NOW })
    ).rejects.toMatchObject({ code: 'NOT_PAID' });

    expect(await prisma.receipt.count()).toBe(0);
    expect(
      await prisma.receiptCounter.findUnique({ where: { fy: FY } })
    ).toBeNull();

    const paid = await makePaidDonation();
    const receipt = await issueReceipt(paid.id, { now: NOW });
    expect(receipt.seq).toBe(1);
  });

  it('keeps the donor snapshot immutable after later donor edits', async () => {
    const donation = await makePaidDonation({ name: 'Original Name' });
    const receipt = await issueReceipt(donation.id, { now: NOW });

    await prisma.donor.update({
      where: { id: donation.donorId },
      data: { name: 'Changed Name' },
    });

    const fresh = await prisma.receipt.findUniqueOrThrow({
      where: { id: receipt.id },
    });
    expect(fresh.donorName).toBe('Original Name');
  });
});
