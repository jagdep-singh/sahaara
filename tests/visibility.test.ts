import { describe, expect, it } from 'vitest';

import { prisma } from '@/lib/db';
import { getPublishedSchemes, pickContent } from '@/lib/schemes';

describe('scheme visibility', () => {
  it('publishes only approved Hindi content and keeps draft schemes hidden', async () => {
    const suffix = Date.now().toString();
    const visible = await prisma.scheme.create({ data: { code: `VIS-${suffix}`, slug: `visible-${suffix}`, need: 'HEALTH', districts: [], rules: [], sourceUrl: 'https://example.org/visible', lastCheckedAt: new Date(), publishedAt: new Date(), contents: { create: { lang: 'hi', title: 'Visible', benefit: 'Benefit', whoCanApply: 'Women', documents: [], howToApply: 'Apply', status: 'APPROVED' } } } });
    const hidden = await prisma.scheme.create({ data: { code: `HID-${suffix}`, slug: `hidden-${suffix}`, need: 'HEALTH', districts: [], rules: [], sourceUrl: 'https://example.org/hidden', lastCheckedAt: new Date(), contents: { create: { lang: 'hi', title: 'Hidden', benefit: 'Benefit', whoCanApply: 'Women', documents: [], howToApply: 'Apply', status: 'DRAFT' } } } });
    const schemes = await getPublishedSchemes({ lang: 'hi', need: 'HEALTH' });
    expect(schemes.some((scheme) => scheme.id === visible.id)).toBe(true);
    expect(schemes.some((scheme) => scheme.id === hidden.id)).toBe(false);
    await prisma.scheme.deleteMany({ where: { id: { in: [visible.id, hidden.id] } } });
  });

  it('falls back to approved Hindi content for English', () => {
    const content = pickContent({ contents: [{ lang: 'hi', status: 'APPROVED' } as never] }, 'en');
    expect(content?.lang).toBe('hi');
  });
});
