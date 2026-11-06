import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatINR } from '@/lib/money';

export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<{ fy?: string }> }) {
  await requireAdmin();
  const fy = (await searchParams).fy;
  const receipts = await prisma.receipt.findMany({ where: fy ? { fy } : undefined, include: { donation: { include: { campaign: true } } }, orderBy: [{ fy: 'desc' }, { seq: 'desc' }], take: 500 });
  const fys = [...new Set(receipts.map((r) => r.fy))];
  return <div className="flex flex-col gap-4"><h1>Receipts</h1><form className="flex flex-wrap gap-2" method="get"><label htmlFor="fy" className="sr-only">Financial year</label><select id="fy" name="fy" defaultValue={fy ?? ''} className="min-h-12 rounded-lg border bg-card px-3"><option value="">All financial years</option>{fys.map((year) => <option key={year} value={year}>{year}</option>)}</select><button className="min-h-12 rounded-lg bg-primary px-4 font-bold text-primary-foreground" type="submit">Filter</button></form>
    {fys.map((year) => { const rows = receipts.filter((r) => r.fy === year).sort((a, b) => a.seq - b.seq); const missing = rows.flatMap((r, i) => r.seq === i + 1 ? [] : [i + 1]); return <div className="rounded-lg border bg-card px-4 py-3" key={year}>FY {year}: {rows.length} receipts, numbers {rows[0]?.seq ?? 0} to {rows.at(-1)?.seq ?? 0}, {missing.length === 0 ? 'contiguous ✓' : `GAP DETECTED: ${missing.join(', ')}`}</div>; })}
    {receipts.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center">No receipts found.</p> : <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[760px] text-left"><thead className="border-b bg-muted/50"><tr>{['Receipt number','Date','Donor','PAN','Amount','Campaign','FY'].map((h) => <th className="px-3 py-3" key={h}>{h}</th>)}</tr></thead><tbody>{receipts.map((r) => <tr className="border-b last:border-0" key={r.id}><td className="px-3 py-3 font-bold">{r.number}</td><td className="px-3 py-3">{r.issuedAt.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td><td className="px-3 py-3">{r.donorName}</td><td className="px-3 py-3">{r.donorPan.slice(0, 5)}****{r.donorPan.slice(9)}</td><td className="px-3 py-3">{formatINR(r.amountPaise)}</td><td className="px-3 py-3">{r.donation.campaign?.titleEn ?? 'General fund'}</td><td className="px-3 py-3">{r.fy}</td></tr>)}</tbody></table></div>}
  </div>;
}
