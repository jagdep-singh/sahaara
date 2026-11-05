import { describe, expect, it } from 'vitest';

import { isValidPan, maskPan, normalizePan } from '@/lib/pan';

describe('normalizePan', () => {
  it('removes whitespace and uppercases', () => {
    expect(normalizePan(' ab cde 1234 f ')).toBe('ABCDE1234F');
  });
});

describe('isValidPan', () => {
  it.each([
    'ABCDE1234F',
    'abcde1234f',
    'ABCDE 1234 F',
  ])('accepts %s', (pan) => {
    expect(isValidPan(pan)).toBe(true);
  });

  it.each([
    '',
    'ABCDE1234',
    'ABCDE12345',
    'ABCD1234F',
    'ABCDE123F',
    'ABCDE1234FF',
  ])('rejects %s', (pan) => {
    expect(isValidPan(pan)).toBe(false);
  });
});

describe('maskPan', () => {
  it('keeps the first five and last characters', () => {
    expect(maskPan('ABCDE1234F')).toBe('ABCDE****F');
  });
});
