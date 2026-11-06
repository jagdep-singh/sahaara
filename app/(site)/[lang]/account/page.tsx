import { redirect } from 'next/navigation';

import { LinkButton } from '@/components/ui/link-button';
import { getDict, type Lang } from '@/i18n';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatINR } from '@/lib/money';

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params; const lang: Lang = rawLang === 'en' ? 'en' : 'hi'; const dict = getDict(lang); const session = await getSession();
  if (!session || session.role !== 'DONOR') redirect(`/${lang}/account/login`);
  const donor = await prisma.donor.findUnique({ where: { email: session.email }, include: { donations: { include: { receipt: true }, orderBy: { createdAt: 'desc' } } } });
  if (!donor) redirect(`/${lang}/account/login`);
  return <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8"><h1>{dict.account.title}</h1><h2>{dict.account.history}</h2>{donor.donations.length === 0 ? <p>{dict.account.empty}</p> : <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[600px] text-left"><thead className="border-b bg-muted/50"><tr><th className="px-3 py-3">{dict.receipt.date}</th><th className="px-3 py-3">{dict.receipt.amount}</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">{dict.account.download}</th></tr></thead><tbody>{donor.donations.map((donation) => <tr className="border-b last:border-0" key={donation.id}><td className="px-3 py-3">{donation.createdAt.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td><td className="px-3 py-3">{formatINR(donation.amountPaise)}</td><td className="px-3 py-3">{donation.status}</td><td className="px-3 py-3">{donation.receipt && <LinkButton size="sm" href={`/api/receipts/${donation.receipt.publicToken}/pdf`}>{dict.account.download}</LinkButton>}</td></tr>)}</tbody></table></div>}</div>;
}
