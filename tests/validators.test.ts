import { describe, expect, it } from 'vitest';

import {
  callbackInputSchema,
  donationInputSchema,
  finderAnswersSchema,
  mobileSchema,
  panSchema,
  rulesSchema,
  schemeContentInputSchema,
} from '@/lib/validators';

const baseDonation = {
  amountRupees: 500,
  type: 'ONE_TIME',
  name: 'Sunita Devi',
  email: 'sunita@example.org',
  pan: 'ABCDE1234F',
  consent: true,
  idempotencyKey: '123e4567-e89b-12d3-a456-426614174000',
};

describe('panSchema', () => {
  it('normalizes and accepts a valid PAN', () => {
    expect(panSchema.parse('abcde 1234 f')).toBe('ABCDE1234F');
  });

  it('rejects an invalid PAN', () => {
    expect(panSchema.safeParse('ABCDE12345').success).toBe(false);
  });
});

describe('mobileSchema', () => {
  it('accepts an Indian mobile number', () => {
    expect(mobileSchema.safeParse('9876543210').success).toBe(true);
  });

  it('rejects numbers starting below 6', () => {
    expect(mobileSchema.safeParse('5876543210').success).toBe(false);
  });

  it('rejects the wrong length', () => {
    expect(mobileSchema.safeParse('987654321').success).toBe(false);
  });
});

describe('donationInputSchema', () => {
  it('accepts the minimum and maximum amounts', () => {
    expect(
      donationInputSchema.safeParse({
        ...baseDonation,
        amountRupees: 100,
      }).success,
    ).toBe(true);

    expect(
      donationInputSchema.safeParse({
        ...baseDonation,
        amountRupees: 1_000_000,
      }).success,
    ).toBe(true);
  });

  it('rejects amounts outside the allowed range', () => {
    expect(
      donationInputSchema.safeParse({
        ...baseDonation,
        amountRupees: 99,
      }).success,
    ).toBe(false);

    expect(
      donationInputSchema.safeParse({
        ...baseDonation,
        amountRupees: 1_000_001,
      }).success,
    ).toBe(false);
  });

  it('rejects fractional rupees', () => {
    expect(
      donationInputSchema.safeParse({
        ...baseDonation,
        amountRupees: 500.5,
      }).success,
    ).toBe(false);
  });

  it('normalizes PAN in the parsed output', () => {
    expect(
      donationInputSchema.parse({
        ...baseDonation,
        pan: 'abcde 1234 f',
      }).pan,
    ).toBe('ABCDE1234F');
  });

  it('requires consent to be true', () => {
    expect(
      donationInputSchema.safeParse({
        ...baseDonation,
        consent: false,
      }).success,
    ).toBe(false);
  });

  it('rejects an invalid email', () => {
    expect(
      donationInputSchema.safeParse({
        ...baseDonation,
        email: 'not-an-email',
      }).success,
    ).toBe(false);
  });

  it('accepts a valid optional phone', () => {
    expect(
      donationInputSchema.safeParse({
        ...baseDonation,
        phone: '9876543210',
      }).success,
    ).toBe(true);
  });

  it('rejects an invalid optional phone', () => {
    expect(
      donationInputSchema.safeParse({
        ...baseDonation,
        phone: '5876543210',
      }).success,
    ).toBe(false);
  });
});

describe('callbackInputSchema', () => {
  const baseCallback = {
    name: 'Sunita Devi',
    phone: '9876543210',
    district: 'Bhopal',
    schemeCodes: ['SCH-014'],
    consent: true,
  };

  it('accepts a valid request', () => {
    expect(callbackInputSchema.safeParse(baseCallback).success).toBe(
      true,
    );
  });

  it('rejects a district outside the seeded list', () => {
    expect(
      callbackInputSchema.safeParse({
        ...baseCallback,
        district: 'Indore',
      }).success,
    ).toBe(false);
  });

  it('rejects more than 20 scheme codes', () => {
    expect(
      callbackInputSchema.safeParse({
        ...baseCallback,
        schemeCodes: Array.from(
          { length: 21 },
          (_, index) => `SCH-${index}`,
        ),
      }).success,
    ).toBe(false);
  });

  it('requires consent', () => {
    expect(
      callbackInputSchema.safeParse({
        ...baseCallback,
        consent: false,
      }).success,
    ).toBe(false);
  });
});

describe('finderAnswersSchema', () => {
  const baseAnswers = {
    age: 30,
    maritalStatus: 'widow',
    hasBplCard: 'yes',
    isShgMember: 'no',
    pregnancy: 'no',
    district: 'Bhopal',
  };

  it('accepts valid answers', () => {
    expect(
      finderAnswersSchema.safeParse(baseAnswers).success,
    ).toBe(true);
  });

  it('rejects ages outside 10 to 100', () => {
    expect(
      finderAnswersSchema.safeParse({
        ...baseAnswers,
        age: 9,
      }).success,
    ).toBe(false);

    expect(
      finderAnswersSchema.safeParse({
        ...baseAnswers,
        age: 101,
      }).success,
    ).toBe(false);
  });

  it('rejects fractional ages', () => {
    expect(
      finderAnswersSchema.safeParse({
        ...baseAnswers,
        age: 30.5,
      }).success,
    ).toBe(false);
  });

  it('rejects an unknown marital status', () => {
    expect(
      finderAnswersSchema.safeParse({
        ...baseAnswers,
        maritalStatus: 'divorced',
      }).success,
    ).toBe(false);
  });

  it('rejects an empty district', () => {
    expect(
      finderAnswersSchema.safeParse({
        ...baseAnswers,
        district: '',
      }).success,
    ).toBe(false);
  });
});

describe('rulesSchema', () => {
  it('accepts eq, in and between rules', () => {
    const rules = [
      {
        fact: 'maritalStatus',
        op: 'eq',
        value: 'widow',
        labelHi: 'विधवा',
        labelEn: 'Widow',
      },
      {
        fact: 'pregnancy',
        op: 'in',
        value: ['first', 'not_first'],
        labelHi: 'गर्भवती',
        labelEn: 'Pregnant',
      },
      {
        fact: 'age',
        op: 'between',
        value: [18, 79],
        labelHi: 'उम्र 18 से 79 वर्ष',
        labelEn: 'Aged 18 to 79',
      },
    ];

    expect(rulesSchema.safeParse(rules).success).toBe(true);
  });

  it('rejects a mismatched op and value', () => {
    expect(
      rulesSchema.safeParse([
        {
          fact: 'age',
          op: 'between',
          value: [18],
          labelHi: 'उम्र',
          labelEn: 'Age',
        },
      ]).success,
    ).toBe(false);
  });

  it('requires both labels', () => {
    expect(
      rulesSchema.safeParse([
        {
          fact: 'age',
          op: 'between',
          value: [18, 79],
          labelHi: 'उम्र',
        },
      ]).success,
    ).toBe(false);
  });
});

describe('schemeContentInputSchema', () => {
  const baseContent = {
    title: 'Scheme title',
    benefit: 'Benefit text',
    whoCanApply: 'Eligibility text',
    documents: ['Aadhaar card'],
    howToApply: 'Apply at the nearest centre.',
  };

  it('accepts valid content', () => {
    expect(
      schemeContentInputSchema.safeParse(baseContent).success,
    ).toBe(true);
  });

  it('enforces the title limit', () => {
    expect(
      schemeContentInputSchema.safeParse({
        ...baseContent,
        title: 'a'.repeat(80),
      }).success,
    ).toBe(true);

    expect(
      schemeContentInputSchema.safeParse({
        ...baseContent,
        title: 'a'.repeat(81),
      }).success,
    ).toBe(false);
  });

  it('enforces the benefit and who-can-apply limits', () => {
    expect(
      schemeContentInputSchema.safeParse({
        ...baseContent,
        benefit: 'a'.repeat(301),
      }).success,
    ).toBe(false);

    expect(
      schemeContentInputSchema.safeParse({
        ...baseContent,
        whoCanApply: 'a'.repeat(301),
      }).success,
    ).toBe(false);
  });

  it('allows at most 10 documents', () => {
    expect(
      schemeContentInputSchema.safeParse({
        ...baseContent,
        documents: Array.from(
          { length: 10 },
          (_, index) => `Document ${index}`,
        ),
      }).success,
    ).toBe(true);

    expect(
      schemeContentInputSchema.safeParse({
        ...baseContent,
        documents: Array.from(
          { length: 11 },
          (_, index) => `Document ${index}`,
        ),
      }).success,
    ).toBe(false);
  });

  it('enforces the per-document limit', () => {
    expect(
      schemeContentInputSchema.safeParse({
        ...baseContent,
        documents: ['a'.repeat(100)],
      }).success,
    ).toBe(true);

    expect(
      schemeContentInputSchema.safeParse({
        ...baseContent,
        documents: ['a'.repeat(101)],
      }).success,
    ).toBe(false);
  });

  it('enforces the how-to-apply limit', () => {
    expect(
      schemeContentInputSchema.safeParse({
        ...baseContent,
        howToApply: 'a'.repeat(600),
      }).success,
    ).toBe(true);

    expect(
      schemeContentInputSchema.safeParse({
        ...baseContent,
        howToApply: 'a'.repeat(601),
      }).success,
    ).toBe(false);
  });
});
