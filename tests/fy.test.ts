import { describe, expect, it } from 'vitest';

import { financialYearIST, formatReceiptNumber } from '@/lib/fy';

describe('financialYearIST', () => {
  it('keeps 31 March 23:59:59 IST in the previous financial year', () => {
    expect(
      financialYearIST(new Date('2026-03-31T18:29:59.000Z')),
    ).toBe('2025-26');
  });

  it('rolls over at 1 April 00:00 IST', () => {
    expect(
      financialYearIST(new Date('2026-03-31T18:30:00.000Z')),
    ).toBe('2026-27');
  });

  it('handles the next March boundary', () => {
    expect(
      financialYearIST(new Date('2027-03-31T18:30:00.000Z')),
    ).toBe('2027-28');
  });

  it('returns the financial year for a mid-year date', () => {
    expect(
      financialYearIST(new Date('2026-09-05T00:00:00.000Z')),
    ).toBe('2026-27');
  });
});

describe('formatReceiptNumber', () => {
  it('pads the sequence and uses the default prefix', () => {
    expect(formatReceiptNumber('2026-27', 123)).toBe(
      '80G/2026-27/000123',
    );
  });

  it('accepts a custom prefix', () => {
    expect(formatReceiptNumber('2026-27', 1, 'TEST')).toBe(
      'TEST/2026-27/000001',
    );
  });
});
