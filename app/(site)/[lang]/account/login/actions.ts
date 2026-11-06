'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function donorLoginAction(formData: FormData) {
  const lang = formData.get('lang') === 'en' ? 'en' : 'hi';
  const parsed = z.object({ email: z.email(), code: z.string().min(1).max(32) }).safeParse({ email: formData.get('email'), code: formData.get('code') });
  if (!parsed.success || parsed.data.code !== process.env.DEMO_OTP || !rateLimit(`donor-login:${parsed.success ? parsed.data.email : 'invalid'}`, 5, 60_000)) redirect(`/${lang}/account/login?error=1`);
  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.upsert({ where: { email }, update: { role: 'DONOR' }, create: { email, role: 'DONOR' } });
  const donor = await prisma.donor.findUnique({ where: { email } });
  if (!donor) redirect(`/${lang}/account/login?error=1`);
  await prisma.donor.update({ where: { id: donor.id }, data: { userId: user.id } });
  await createSession({ userId: user.id, role: 'DONOR', email });
  redirect(`/${lang}/account`);
}
