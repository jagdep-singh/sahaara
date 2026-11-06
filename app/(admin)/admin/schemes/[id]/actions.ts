'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { rulesSchema, schemeContentInputSchema } from '@/lib/validators';

const schemeSchema = z.object({ code: z.string().trim().min(2).max(30), slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/), need: z.enum(['PENSION', 'LIVELIHOOD', 'HEALTH', 'EDUCATION']), districts: z.array(z.string()), sourceUrl: z.url().startsWith('https://'), lastCheckedAt: z.coerce.date() });
function content(formData: FormData, lang: 'hi' | 'en') { return schemeContentInputSchema.parse({ title: formData.get(`${lang}_title`), benefit: formData.get(`${lang}_benefit`), whoCanApply: formData.get(`${lang}_whoCanApply`), documents: String(formData.get(`${lang}_documents`) ?? '').split('\n').map((s) => s.trim()).filter(Boolean), howToApply: formData.get(`${lang}_howToApply`) }); }

export async function saveScheme(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get('id') ?? 'new');
  const parsed = schemeSchema.parse({ code: formData.get('code'), slug: formData.get('slug'), need: formData.get('need'), districts: formData.getAll('districts'), sourceUrl: formData.get('sourceUrl'), lastCheckedAt: formData.get('lastCheckedAt') });
  const rules = rulesSchema.parse(JSON.parse(String(formData.get('rules') ?? '[]')));
  const data = { ...parsed, rules };
  const scheme = id === 'new' ? await prisma.scheme.create({ data: { ...data, contents: { create: [{ lang: 'hi', ...content(formData, 'hi') }, { lang: 'en', ...content(formData, 'en') }] } } }) : await prisma.scheme.update({ where: { id }, data: { ...data, contents: { upsert: [{ where: { schemeId_lang: { schemeId: id, lang: 'hi' } }, update: { ...content(formData, 'hi'), status: 'DRAFT', origin: 'HUMAN', approvedAt: null, approvedById: null }, create: { lang: 'hi', ...content(formData, 'hi') } }, { where: { schemeId_lang: { schemeId: id, lang: 'en' } }, update: { ...content(formData, 'en'), status: 'DRAFT', origin: 'HUMAN', approvedAt: null, approvedById: null }, create: { lang: 'en', ...content(formData, 'en') } }] } } });
  await logAudit({ actorId: admin.userId, action: id === 'new' ? 'scheme.create' : 'scheme.update', entity: 'Scheme', entityId: scheme.id });
  redirect(`/admin/schemes/${scheme.id}`);
}

export async function approveContent(formData: FormData) {
  const admin = await requireAdmin(); const id = String(formData.get('id')); const lang = z.enum(['hi', 'en']).parse(formData.get('lang'));
  const scheme = await prisma.scheme.findUnique({ where: { id }, include: { contents: true } });
  const item = scheme?.contents.find((c) => c.lang === lang);
  if (!scheme || !item || !scheme.lastCheckedAt || formData.get('sourceChecked') !== 'on' || (Array.isArray(item.aiWarnings) && item.aiWarnings.length > 0 && formData.get('warningsReviewed') !== 'on')) throw new Error('APPROVAL_PRECONDITION');
  await prisma.schemeContent.update({ where: { id: item.id }, data: { status: 'APPROVED', approvedById: admin.userId, approvedAt: new Date() } });
  await logAudit({ actorId: admin.userId, action: 'content.approve', entity: 'SchemeContent', entityId: item.id });
  redirect(`/admin/schemes/${id}`);
}

export async function publishScheme(formData: FormData) { const admin = await requireAdmin(); const id = String(formData.get('id')); const scheme = await prisma.scheme.findUnique({ where: { id }, include: { contents: true } }); if (!scheme || scheme.contents.find((c) => c.lang === 'hi')?.status !== 'APPROVED') throw new Error('PUBLISH_PRECONDITION'); await prisma.scheme.update({ where: { id }, data: { publishedAt: new Date() } }); await logAudit({ actorId: admin.userId, action: 'scheme.publish', entity: 'Scheme', entityId: id }); redirect(`/admin/schemes/${id}`); }
export async function unpublishScheme(formData: FormData) { const admin = await requireAdmin(); const id = String(formData.get('id')); await prisma.scheme.update({ where: { id }, data: { publishedAt: null } }); await logAudit({ actorId: admin.userId, action: 'scheme.unpublish', entity: 'Scheme', entityId: id }); redirect(`/admin/schemes/${id}`); }
