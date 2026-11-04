import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

import { PrismaClient } from '../lib/generated/prisma/client';
import { CAMPAIGN, HELP_CENTRES, SEED_SCHEMES } from './seed-data';

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set`);
  return value;
}

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL must be set');

const adminEmail = requiredEnv('ADMIN_EMAIL').trim().toLowerCase();
const adminPassword = requiredEnv('ADMIN_PASSWORD');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const demoDonorEmail = 'donor@example.org';
const publishedAt = new Date('2026-10-01T00:00:00.000Z');
const consentAt = new Date('2026-09-01T00:00:00.000Z');

async function main() {
  const passwordHash = await hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: 'ADMIN' },
    create: { email: adminEmail, passwordHash, role: 'ADMIN' },
  });

  const donorUser = await prisma.user.upsert({
    where: { email: demoDonorEmail },
    update: { role: 'DONOR' },
    create: { email: demoDonorEmail, role: 'DONOR' },
  });

  await prisma.donor.upsert({
    where: { email: demoDonorEmail },
    update: {
      userId: donorUser.id,
      name: 'Demo Donor',
      pan: 'ZZZZZ0000Z',
      consentAt,
      consentVersion: 'v1',
    },
    create: {
      userId: donorUser.id,
      name: 'Demo Donor',
      email: demoDonorEmail,
      pan: 'ZZZZZ0000Z',
      consentAt,
      consentVersion: 'v1',
    },
  });

  await prisma.campaign.upsert({
    where: { slug: CAMPAIGN.slug },
    update: { ...CAMPAIGN },
    create: { ...CAMPAIGN },
  });

  for (const centre of HELP_CENTRES) {
    await prisma.helpCentre.upsert({
      where: { id: centre.id },
      update: centre,
      create: centre,
    });
  }

  for (const item of SEED_SCHEMES) {
    const data = {
      slug: item.slug,
      need: item.need,
      districts: item.districts,
      rules: item.rules,
      sourceUrl: `https://example.org/official-notice/${item.code}`,
      lastCheckedAt: new Date(`${item.lastCheckedAt}T00:00:00.000Z`),
      isIllustrative: true,
      publishedAt,
    };

    const scheme = await prisma.scheme.upsert({
      where: { code: item.code },
      update: data,
      create: { code: item.code, ...data },
    });

    for (const content of item.contents) {
      const contentData = {
        ...content,
        status: 'APPROVED' as const,
        origin: 'HUMAN' as const,
        approvedById: admin.id,
        approvedAt: publishedAt,
      };

      await prisma.schemeContent.upsert({
        where: { schemeId_lang: { schemeId: scheme.id, lang: content.lang } },
        update: contentData,
        create: { schemeId: scheme.id, ...contentData },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
