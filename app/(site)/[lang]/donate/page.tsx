import { randomUUID } from 'node:crypto';

import { getActiveCampaigns } from '@/lib/campaigns';
import { getDict, type Lang } from '@/i18n';

import { DonateWizard } from './wizard-client';

type DonatePageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    campaign?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DonatePage({
  params,
  searchParams,
}: DonatePageProps) {
  const [{ lang: rawLang }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const lang: Lang = rawLang === 'en' ? 'en' : 'hi';
  const dict = getDict(lang);
  const campaigns = await getActiveCampaigns(lang);
  const requestedCampaign = firstParam(query.campaign);
  const initialCampaignSlug =
    campaigns.find(
      (campaign) => campaign.slug === requestedCampaign
    )?.slug ?? '';

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <h1>{dict.common.donate}</h1>
      <DonateWizard
        lang={lang}
        dict={dict}
        campaigns={campaigns}
        initialCampaignSlug={initialCampaignSlug}
        idempotencyKey={randomUUID()}
      />
    </div>
  );
}
