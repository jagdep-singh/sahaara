import { prisma } from '@/lib/db';
import type { Lang } from '@/i18n';

export type ActiveCampaign = {
  id: string;
  slug: string;
  title: string;
};

export async function getActiveCampaigns(
  lang: Lang
): Promise<ActiveCampaign[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    orderBy: { titleHi: 'asc' },
    select: {
      id: true,
      slug: true,
      titleHi: true,
      titleEn: true,
    },
  });

  return campaigns.map((campaign) => ({
    id: campaign.id,
    slug: campaign.slug,
    title: lang === 'hi' ? campaign.titleHi : campaign.titleEn,
  }));
}

export function getActiveCampaignBySlug(slug: string) {
  return prisma.campaign.findFirst({
    where: { slug, isActive: true },
  });
}
