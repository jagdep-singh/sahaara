'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getDict, isLang, type Lang } from '@/i18n';
import { getActiveCampaignBySlug } from '@/lib/campaigns';
import { createDonationRecord } from '@/lib/donations';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { donationInputSchema } from '@/lib/validators';

export type DonationFieldErrors = {
  amount?: string;
  campaign?: string;
  name?: string;
  email?: string;
  phone?: string;
  pan?: string;
  consent?: string;
};

export type DonationState = {
  error?: string;
  fieldErrors?: DonationFieldErrors;
};

const DONATION_RATE_LIMIT = 20;
const DONATION_RATE_WINDOW_MS = 60 * 1000;

export async function createDonation(
  _prevState: DonationState,
  formData: FormData
): Promise<DonationState> {
  const rawLang = String(formData.get('lang') ?? '');
  const locale: Lang = isLang(rawLang) ? rawLang : 'hi';
  const dict = getDict(locale);
  const ip = clientIp((await headers()).get('x-forwarded-for'));

  if (
    !rateLimit(
      `createDonation:${ip}`,
      DONATION_RATE_LIMIT,
      DONATION_RATE_WINDOW_MS
    )
  ) {
    return { error: dict.donate.rateLimited };
  }

  const rawPhone = String(formData.get('phone') ?? '').trim();
  const parsed = donationInputSchema.safeParse({
    amountRupees: Number(formData.get('amountRupees')),
    type: formData.get('type'),
    campaignSlug:
      String(formData.get('campaignSlug') ?? '').trim() || undefined,
    name: formData.get('name'),
    email: formData.get('email'),
    phone: rawPhone || undefined,
    pan: formData.get('pan'),
    consent: formData.get('consent') === 'on',
    idempotencyKey: formData.get('idempotencyKey'),
  });

  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    const fieldErrors: DonationFieldErrors = {
      amount: fields.amountRupees
        ? dict.donate.amountError
        : undefined,
      campaign: fields.campaignSlug ? dict.common.error : undefined,
      name: fields.name ? dict.common.required : undefined,
      email: fields.email ? dict.donate.emailError : undefined,
      phone: fields.phone ? dict.donate.phoneError : undefined,
      pan: fields.pan ? dict.donate.panError : undefined,
      consent: fields.consent ? dict.common.required : undefined,
    };

    return Object.values(fieldErrors).some(Boolean)
      ? { fieldErrors }
      : { error: dict.common.error };
  }

  let campaignId: string | null = null;

  if (parsed.data.campaignSlug) {
    try {
      const campaign = await getActiveCampaignBySlug(
        parsed.data.campaignSlug
      );
      if (!campaign) {
        return {
          fieldErrors: { campaign: dict.common.error },
        };
      }
      campaignId = campaign.id;
    } catch {
      console.error('[donation] campaign lookup failed');
      return { error: dict.common.error };
    }
  }

  let donation;

  try {
    donation = await createDonationRecord(parsed.data, campaignId);
  } catch {
    console.error('[donation] create failed');
    return { error: dict.common.error };
  }

  redirect(`/${locale}/donate/pay/${donation.id}`);
}
