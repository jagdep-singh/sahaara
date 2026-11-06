import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireAdmin();
  const q = (await searchParams).q?.trim() ?? '';
  const schemes = await prisma.scheme.findMany({ where: q ? { OR: [{ code: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }, { contents: { some: { title: { contains: q, mode: 'insensitive' } } } }] } : undefined, include: { contents: true }, orderBy: { code: 'asc' } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1>Scheme management</h1><p className="text-muted-foreground">Signed in as {session.email}.</p></div><Button asChild><Link href="/admin/schemes/new">New scheme</Link></Button></div>
      <form className="flex gap-2" method="get"><label className="sr-only" htmlFor="q">Search schemes</label><input id="q" name="q" defaultValue={q} placeholder="Search code or title" className="min-h-12 flex-1 rounded-lg border bg-card px-3" /><Button type="submit" variant="secondary">Search</Button></form>
      {schemes.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center">No schemes found. <Link className="font-bold text-primary underline" href="/admin/schemes/new">Create one</Link>.</div> : <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[760px] text-left"><thead className="border-b bg-muted/50"><tr>{['Code','Hindi title','English title','Need','Hindi','English','Published','Last checked'].map((h) => <th className="px-3 py-3" key={h}>{h}</th>)}</tr></thead><tbody>{schemes.map((scheme) => { const hi = scheme.contents.find((c) => c.lang === 'hi'); const en = scheme.contents.find((c) => c.lang === 'en'); return <tr key={scheme.id} className="border-b last:border-0 hover:bg-muted/40"><td className="px-3 py-3"><Link className="font-bold text-primary underline" href={`/admin/schemes/${scheme.id}`}>{scheme.code}</Link></td><td className="px-3 py-3">{hi?.title ?? '—'}</td><td className="px-3 py-3">{en?.title ?? '—'}</td><td className="px-3 py-3">{scheme.need}</td><td className="px-3 py-3"><Badge variant={hi?.status === 'APPROVED' ? 'default' : 'outline'}>{hi?.status ?? 'Missing'}</Badge></td><td className="px-3 py-3"><Badge variant={en?.status === 'APPROVED' ? 'default' : 'outline'}>{en?.status ?? 'Missing'}</Badge></td><td className="px-3 py-3">{scheme.publishedAt ? 'Yes' : 'No'}</td><td className="px-3 py-3">{scheme.lastCheckedAt.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>; })}</tbody></table></div>}
    </div>
  );
}
