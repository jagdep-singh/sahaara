import { describe, expect, it } from 'vitest';

import { checkDraft } from '@/lib/ai-check';

describe('checkDraft', () => {
  it('detects missing and extra numbers while ignoring years', () => {
    const warnings = checkDraft('योजना 600 रुपये वर्ष 2026 में', { benefit: '500 रुपये' });
    expect(warnings.map((w) => w.code)).toEqual(expect.arrayContaining(['NUMBER_MISSING', 'NUMBER_EXTRA']));
  });
  it('normalises Devanagari digits and flags promise wording', () => {
    const warnings = checkDraft('लाभ ६०० रुपये', { benefit: 'पात्र होने पर 600 रुपये पक्का मिलेगा' });
    expect(warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'PROMISE_WORD' })]));
    expect(warnings.some((w) => w.code === 'NUMBER_MISSING')).toBe(false);
  });
  it('flags non-Hindi output and accepts clean Hindi', () => {
    expect(checkDraft('लाभ 600', { benefit: 'This is English' }).some((w) => w.code === 'NOT_HINDI')).toBe(true);
    expect(checkDraft('लाभ 600', { benefit: 'पात्र होने पर 600 रुपये की मदद' })).toEqual([]);
  });
});
