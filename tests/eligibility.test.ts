import { describe, expect, it } from 'vitest';

import {
  evalRule,
  matchSchemes,
  type Answers,
  type Rule,
  type SchemeForMatch,
} from '@/lib/eligibility';
import { SEED_SCHEMES } from '@/prisma/seed-data';

const briefSchemes: SchemeForMatch[] = SEED_SCHEMES.map(
  ({ code, slug, districts, rules }) => ({
    code,
    slug,
    districts,
    rules,
  })
);

const matchingAnswers: Answers = {
  age: 45,
  maritalStatus: 'widow',
  hasBplCard: 'yes',
  isShgMember: 'yes',
  pregnancy: 'first',
};

const bplRule: Rule = {
  fact: 'hasBplCard',
  op: 'eq',
  value: 'yes',
  labelHi: 'BPL कार्ड है',
  labelEn: 'Has a BPL card',
};

const shgRule: Rule = {
  fact: 'isShgMember',
  op: 'eq',
  value: 'yes',
  labelHi: 'SHG सदस्य',
  labelEn: 'SHG member',
};

function findCode(matches: ReturnType<typeof matchSchemes>, code: string) {
  return matches.find((match) => match.code === code);
}

describe('evalRule', () => {
  it('evaluates eq rules', () => {
    expect(evalRule(bplRule, { hasBplCard: 'yes' })).toBe('met');
    expect(evalRule(bplRule, { hasBplCard: 'no' })).toBe('unmet');
    expect(evalRule(bplRule, { hasBplCard: 'unsure' })).toBe('unknown');
  });

  it('evaluates in rules', () => {
    const rule: Rule = {
      fact: 'maritalStatus',
      op: 'in',
      value: ['widow', 'single'],
      labelHi: 'विधवा या अविवाहित',
      labelEn: 'Widow or single',
    };

    expect(evalRule(rule, { maritalStatus: 'widow' })).toBe('met');
    expect(evalRule(rule, { maritalStatus: 'single' })).toBe('met');
    expect(evalRule(rule, { maritalStatus: 'married' })).toBe('unmet');
  });

  it('evaluates between rules and includes the boundaries', () => {
    const rule: Rule = {
      fact: 'age',
      op: 'between',
      value: [18, 79],
      labelHi: 'उम्र 18 से 79 वर्ष',
      labelEn: 'Aged 18 to 79',
    };

    expect(evalRule(rule, { age: 17 })).toBe('unmet');
    expect(evalRule(rule, { age: 18 })).toBe('met');
    expect(evalRule(rule, { age: 79 })).toBe('met');
    expect(evalRule(rule, { age: 80 })).toBe('unmet');
  });

  it('returns unknown when the fact is unanswered', () => {
    expect(evalRule(bplRule, {})).toBe('unknown');
    expect(
      evalRule(
        {
          fact: 'age',
          op: 'between',
          value: [18, 79],
          labelHi: 'उम्र 18 से 79 वर्ष',
          labelEn: 'Aged 18 to 79',
        },
        {}
      )
    ).toBe('unknown');
  });
});

describe('matchSchemes', () => {
  it('matches all three brief schemes on the right answers', () => {
    const matches = matchSchemes(briefSchemes, matchingAnswers);

    expect(findCode(matches, 'SCH-014')?.status).toBe('match');
    expect(findCode(matches, 'SCH-022')?.status).toBe('match');
    expect(findCode(matches, 'SCH-031')?.status).toBe('match');
  });

  it('drops each scheme when one of its rules is unmet', () => {
    const wrongCases: Array<{ code: string; answers: Partial<Answers> }> = [
      { code: 'SCH-014', answers: { age: 17 } },
      { code: 'SCH-014', answers: { maritalStatus: 'married' } },
      { code: 'SCH-014', answers: { hasBplCard: 'no' } },
      { code: 'SCH-022', answers: { isShgMember: 'no' } },
      { code: 'SCH-031', answers: { pregnancy: 'not_first' } },
    ];

    for (const { code, answers } of wrongCases) {
      const matches = matchSchemes(briefSchemes, {
        ...matchingAnswers,
        ...answers,
      });

      expect(findCode(matches, code), `${code} should be excluded`).toBe(
        undefined
      );
    }
  });

  it('enforces the SCH-014 age boundaries', () => {
    const cases = [
      { age: 17, included: false },
      { age: 18, included: true },
      { age: 79, included: true },
      { age: 80, included: false },
    ];

    for (const { age, included } of cases) {
      const match = findCode(
        matchSchemes(briefSchemes, { ...matchingAnswers, age }),
        'SCH-014'
      );

      expect(Boolean(match), `age ${age}`).toBe(included);
      if (match) expect(match.status).toBe('match');
    }
  });

  it('marks unsure answers as needs checking', () => {
    const match = findCode(
      matchSchemes(briefSchemes, {
        ...matchingAnswers,
        hasBplCard: 'unsure',
      }),
      'SCH-014'
    );

    expect(match?.status).toBe('check');
    expect(
      match?.results.find((result) => result.rule.fact === 'hasBplCard')
        ?.result
    ).toBe('unknown');
  });

  it('filters by district and treats an empty district list as everywhere', () => {
    const scoped: SchemeForMatch = {
      code: 'SCH-SCOPED',
      slug: 'scoped',
      districts: ['Bhopal'],
      rules: [],
    };
    const everywhere: SchemeForMatch = {
      code: 'SCH-EVERYWHERE',
      slug: 'everywhere',
      districts: [],
      rules: [],
    };

    expect(
      matchSchemes([scoped, everywhere], { district: 'Sehore' }).map(
        (match) => match.code
      )
    ).toEqual(['SCH-EVERYWHERE']);

    expect(
      matchSchemes([scoped], { district: 'Bhopal' }).map(
        (match) => match.code
      )
    ).toEqual(['SCH-SCOPED']);
  });

  it('puts matches before checks', () => {
    const matchOnly: SchemeForMatch = {
      code: 'SCH-MATCH',
      slug: 'match',
      districts: [],
      rules: [bplRule],
    };
    const checkOnly: SchemeForMatch = {
      code: 'SCH-CHECK',
      slug: 'check',
      districts: [],
      rules: [bplRule, shgRule],
    };

    const matches = matchSchemes([checkOnly, matchOnly], {
      hasBplCard: 'yes',
    });

    expect(matches.map((match) => match.code)).toEqual([
      'SCH-MATCH',
      'SCH-CHECK',
    ]);
    expect(matches.map((match) => match.status)).toEqual([
      'match',
      'check',
    ]);
  });
});
