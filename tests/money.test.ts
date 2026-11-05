import { describe, expect, it } from 'vitest';

import {
  formatINR,
  rupeesInWords,
  rupeesToPaise,
} from '@/lib/money';

describe('rupeesToPaise', () => {
  it('converts whole rupees to paise', () => {
    expect(rupeesToPaise(500)).toBe(50_000);
  });

  it('rounds fractional rupees to the nearest paise', () => {
    expect(rupeesToPaise(19.99)).toBe(1_999);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
  });
});

describe('formatINR', () => {
  it('formats paise using Indian digit grouping', () => {
    expect(formatINR(500_000)).toBe('₹5,000');
    expect(formatINR(10_000_000)).toBe('₹1,00,000');
    expect(formatINR(123_456)).toBe('₹1,234.56');
  });

  it('omits decimals for whole rupees', () => {
    expect(formatINR(100)).toBe('₹1');
  });

  it('shows two decimals when paise are present', () => {
    expect(formatINR(150)).toBe('₹1.50');
  });
});

describe('rupeesInWords', () => {
  it('writes zero', () => {
    expect(rupeesInWords(0)).toBe('Zero Rupees Only');
  });

  it('writes thousands', () => {
    expect(rupeesInWords(5_000)).toBe(
      'Five Thousand Rupees Only',
    );
  });

  it('writes lakhs and thousands', () => {
    expect(rupeesInWords(125_000)).toBe(
      'One Lakh Twenty Five Thousand Rupees Only',
    );
  });

  it('writes crores', () => {
    expect(rupeesInWords(10_000_000)).toBe(
      'One Crore Rupees Only',
    );
  });

  it('writes hundreds', () => {
    expect(rupeesInWords(100)).toBe(
      'One Hundred Rupees Only',
    );
  });
});
