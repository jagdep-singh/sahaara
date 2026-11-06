import { notFound } from 'next/navigation';

import { LinkButton } from '@/components/ui/link-button';
import { getDict, type Lang } from '@/i18n';
import { getActiveCampaignBySlug } from '@/lib/campaigns';

export default async function CampaignPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: rawLang, slug } = await params;
  const lang: Lang = rawLang === 'en' ? 'en' : 'hi';
  const dict = getDict(lang);
  const campaign = await getActiveCampaignBySlug(slug);
  if (!campaign) notFound();
  return <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8"><h1>{lang === 'hi' ? campaign.titleHi : campaign.titleEn}</h1><p className="text-xl">{lang === 'hi' ? campaign.descriptionHi : campaign.descriptionEn}</p><LinkButton href={`/${lang}/donate?campaign=${encodeURIComponent(campaign.slug)}`}>{dict.campaign.donate}</LinkButton></div>;
}
