import { describe, expect, it } from 'vitest';

import { AiOutputError, draftHindiSummary, type AiClient } from '@/lib/ai-draft';

const valid = JSON.stringify({ title: 'मातृत्व सहायता', benefit: 'पात्र होने पर 600 रुपये।', whoCanApply: 'महिलाओं के लिए।', documents: ['आधार कार्ड'], howToApply: 'केंद्र पर जाएँ।' });

describe('draftHindiSummary', () => {
  it('parses fenced JSON and returns warnings', async () => {
    const client: AiClient = { complete: async () => `text\n${valid}\ntext` };
    const result = await draftHindiSummary('लाभ 600 रुपये', client);
    expect(result.draft.title).toBe('मातृत्व सहायता');
  });
  it('retries invalid output once', async () => {
    let calls = 0; const client: AiClient = { complete: async () => ++calls === 1 ? 'not json' : valid };
    await draftHindiSummary('लाभ 600 रुपये', client); expect(calls).toBe(2);
  });
  it('fails after two invalid responses', async () => {
    const client: AiClient = { complete: async () => 'not json' };
    await expect(draftHindiSummary('लाभ 600 रुपये', client)).rejects.toBeInstanceOf(AiOutputError);
  });
});
