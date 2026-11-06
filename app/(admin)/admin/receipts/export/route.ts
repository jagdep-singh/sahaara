import { assertAdminOrThrow } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
const csv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
export async function GET() { let admin; try { admin = await assertAdminOrThrow(); } catch { return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 }); } const rows = await prisma.receipt.findMany({ orderBy: { issuedAt: 'asc' }, include: { donation: { include: { campaign: true } } } }); const body = ['number,date,donor,masked_pan,amount_paise,campaign', ...rows.map((r) => [r.number, r.issuedAt.toISOString(), r.donorName, `${r.donorPan.slice(0,5)}****${r.donorPan.slice(9)}`, r.amountPaise, r.donation.campaign?.titleEn ?? 'General fund'].map(csv).join(','))].join('\n'); await logAudit({ actorId: admin.userId, action: 'receipt.export', entity: 'Receipt', entityId: 'export' }); return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="receipts.csv"', 'Cache-Control': 'no-store' } }); }
