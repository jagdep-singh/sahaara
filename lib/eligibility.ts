export type Answers = {
  age?: number;
  maritalStatus?: 'married' | 'widow' | 'single' | 'other';
  hasBplCard?: 'yes' | 'no' | 'unsure';
  isShgMember?: 'yes' | 'no' | 'unsure';
  pregnancy?: 'no' | 'first' | 'not_first';
  district?: string;
};

export type Fact =
  | 'age'
  | 'maritalStatus'
  | 'hasBplCard'
  | 'isShgMember'
  | 'pregnancy';

export type Rule = {
  fact: Fact;
  op: 'eq' | 'in' | 'between';
  value: string | string[] | [number, number];
  labelHi: string;
  labelEn: string;
};

export type RuleResult = 'met' | 'unmet' | 'unknown';

export function evalRule(rule: Rule, answers: Answers): RuleResult {
  const answer = answers[rule.fact];
  if (answer === undefined || answer === 'unsure') return 'unknown';

  switch (rule.op) {
    case 'eq':
      return answer === rule.value ? 'met' : 'unmet';
    case 'in':
      return (rule.value as string[]).includes(answer as string)
        ? 'met'
        : 'unmet';
    case 'between': {
      const [low, high] = rule.value as [number, number];
      return typeof answer === 'number' && answer >= low && answer <= high
        ? 'met'
        : 'unmet';
    }
  }
}

export type SchemeForMatch = {
  code: string;
  slug: string;
  districts: string[];
  rules: Rule[];
};

export type Match = {
  code: string;
  slug: string;
  status: 'match' | 'check';
  results: { rule: Rule; result: RuleResult }[];
};

export function matchSchemes(
  schemes: SchemeForMatch[],
  answers: Answers
): Match[] {
  const matches: Match[] = [];

  for (const scheme of schemes) {
    if (
      answers.district &&
      scheme.districts.length > 0 &&
      !scheme.districts.includes(answers.district)
    ) {
      continue;
    }

    const results = scheme.rules.map((rule) => ({
      rule,
      result: evalRule(rule, answers),
    }));

    if (results.some((result) => result.result === 'unmet')) continue;

    matches.push({
      code: scheme.code,
      slug: scheme.slug,
      status: results.every((result) => result.result === 'met')
        ? 'match'
        : 'check',
      results,
    });
  }

  return matches.sort((a, b) =>
    a.status === b.status ? 0 : a.status === 'match' ? -1 : 1
  );
}
