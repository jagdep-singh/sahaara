import { NextRequest } from 'next/server';
import { z } from 'zod';

import { assertAdminOrThrow } from '@/lib/auth';
import { draftHindiSummary, AiOutputError, AiUnavailableError } from '@/lib/ai-draft';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30;

const bodySchema = z.object({ schemeId: z.string().min(1), notice: z.string().min(50).max(8000) });

export async function POST(request: NextRequest) {
  let session;
  try { session = await assertAdminOrThrow(); } catch (error) {
    return Response.json({ error: error instanceof Error && error.message === 'FORBIDDEN' ? 'FORBIDDEN' : 'UNAUTHENTICATED' }, { status: error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 401 });
  }
  if (!rateLimit(`ai-draft:${clientIp(request.headers.get('x-forwarded-for'))}`, 10, 60_000)) return Response.json({ error: 'RATE_LIMITED' }, { status: 429 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'BAD_BODY', issues: parsed.error.flatten() }, { status: 400 });
  const scheme = await prisma.scheme.findUnique({ where: { id: parsed.data.schemeId }, select: { id: true, code: true } });
  if (!scheme) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const result = await draftHindiSummary(parsed.data.notice);
    const content = await prisma.schemeContent.upsert({ where: { schemeId_lang: { schemeId: scheme.id, lang: 'hi' } }, update: { ...result.draft, status: 'DRAFT', origin: 'AI_DRAFT', aiWarnings: result.warnings, approvedById: null, approvedAt: null }, create: { schemeId: scheme.id, lang: 'hi', ...result.draft, status: 'DRAFT', origin: 'AI_DRAFT', aiWarnings: result.warnings } });
    await logAudit({ actorId: session.userId, action: 'content.ai_draft', entity: 'SchemeContent', entityId: content.id, meta: { schemeCode: scheme.code } });
    return Response.json({ content, warnings: result.warnings });
  } catch (error) {
    if (error instanceof AiUnavailableError) return Response.json({ code: 'AI_UNAVAILABLE' }, { status: 503 });
    if (error instanceof AiOutputError || error instanceof z.ZodError) return Response.json({ code: 'AI_BAD_OUTPUT' }, { status: 502 });
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }
}
