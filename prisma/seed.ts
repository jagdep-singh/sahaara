import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

import { PrismaClient } from '../lib/generated/prisma/client';
import { issueReceipt } from '../lib/receipts';
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

const EXTRA_SCHEMES = [
  ['SCH-041', 'womens-old-age-pension', 'PENSION', [], '2026-09-20', [
    { fact: 'age', op: 'between', value: [60, 120], labelHi: 'उम्र 60 से 120 वर्ष', labelEn: 'Aged 60 to 120' },
    { fact: 'hasBplCard', op: 'eq', value: 'yes', labelHi: 'BPL कार्ड है', labelEn: 'Has a BPL card' },
  ], 'वृद्ध महिला पेंशन', 'Women aged 60 to 120 with a BPL card.', 'महिलाओं के लिए हर महीने ₹500 की पेंशन।'],
  ['SCH-042', 'support-for-separated-women', 'PENSION', ['Bhopal', 'Sehore'], '2026-08-14', [
    { fact: 'maritalStatus', op: 'eq', value: 'other', labelHi: 'अन्य वैवाहिक स्थिति', labelEn: 'Other marital status' },
    { fact: 'age', op: 'between', value: [18, 59], labelHi: 'उम्र 18 से 59 वर्ष', labelEn: 'Aged 18 to 59' },
    { fact: 'hasBplCard', op: 'eq', value: 'yes', labelHi: 'BPL कार्ड है', labelEn: 'Has a BPL card' },
  ], 'अलग रह रही महिलाओं की सहायता', 'Separated women aged 18 to 59 with a BPL card.', 'हर महीने ₹400 की सहायता।'],
  ['SCH-051', 'shg-start-up-grant', 'LIVELIHOOD', ['Raisen', 'Vidisha'], '2026-10-01', [{ fact: 'isShgMember', op: 'eq', value: 'yes', labelHi: 'SHG की सदस्य', labelEn: 'SHG member' }], 'स्वयं सहायता समूह शुरुआत अनुदान', 'Member of a registered SHG.', 'नए समूह के लिए एक बार ₹10,000।'],
  ['SCH-052', 'skill-training-stipend', 'LIVELIHOOD', [], '2026-09-28', [{ fact: 'age', op: 'between', value: [18, 40], labelHi: 'उम्र 18 से 40 वर्ष', labelEn: 'Aged 18 to 40' }], 'कौशल प्रशिक्षण सहायता', 'Women aged 18 to 40.', '3 महीने के कोर्स में हर महीने ₹1,500।'],
  ['SCH-053', 'micro-enterprise-subsidy', 'LIVELIHOOD', [], '2026-10-10', [{ fact: 'age', op: 'between', value: [18, 55], labelHi: 'उम्र 18 से 55 वर्ष', labelEn: 'Aged 18 to 55' }], 'छोटे कारोबार की सहायता', 'Women aged 18 to 55.', '₹50,000 तक 25% सहायता।'],
  ['SCH-061', 'hospital-delivery-incentive', 'HEALTH', [], '2026-10-12', [{ fact: 'pregnancy', op: 'in', value: ['first', 'not_first'], labelHi: 'गर्भवती महिला', labelEn: 'Pregnant woman' }], 'अस्पताल प्रसव प्रोत्साहन', 'Pregnant women.', 'एक बार ₹1,000 की सहायता।'],
  ['SCH-062', 'womens-health-checkups', 'HEALTH', ['Bhopal', 'Raisen'], '2026-10-20', [{ fact: 'age', op: 'between', value: [18, 120], labelHi: 'उम्र 18 वर्ष या अधिक', labelEn: 'Aged 18 or older' }], 'महिला स्वास्थ्य जाँच शिविर', 'Women aged 18 or older.', 'मुफ़्त स्वास्थ्य जाँच।'],
  ['SCH-071', 'girls-higher-education-scholarship', 'EDUCATION', [], '2026-09-05', [{ fact: 'age', op: 'between', value: [17, 25], labelHi: 'उम्र 17 से 25 वर्ष', labelEn: 'Aged 17 to 25' }, { fact: 'hasBplCard', op: 'eq', value: 'yes', labelHi: 'BPL कार्ड है', labelEn: 'Has a BPL card' }], 'बालिका उच्च शिक्षा छात्रवृत्ति', 'Girls aged 17 to 25 with a BPL card.', 'हर साल ₹6,000 की छात्रवृत्ति।'],
] as const;

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

  for (const [code, slug, need, districts, lastCheckedAt, rules, titleHi, whoEn, benefitHi] of EXTRA_SCHEMES) {
    const isDraft = code === 'SCH-071';
    const scheme = await prisma.scheme.upsert({
      where: { code },
      update: { slug, need, districts: [...districts], rules, sourceUrl: `https://example.org/official-notice/${code}`, lastCheckedAt: new Date(`${lastCheckedAt}T00:00:00.000Z`), isIllustrative: true, publishedAt: isDraft ? null : publishedAt },
      create: { code, slug, need, districts: [...districts], rules, sourceUrl: `https://example.org/official-notice/${code}`, lastCheckedAt: new Date(`${lastCheckedAt}T00:00:00.000Z`), isIllustrative: true, publishedAt: isDraft ? null : publishedAt },
    });
    const englishTitle = titleHi.replace('वृद्ध महिला पेंशन', "Women's old-age pension").replace('अलग रह रही महिलाओं की सहायता', 'Support for separated women').replace('विधवा पुनर्विवाह अनुदान', 'Widow remarriage grant').replace('स्वयं सहायता समूह शुरुआत अनुदान', 'SHG start-up grant').replace('कौशल प्रशिक्षण सहायता', 'Skill training stipend').replace('छोटे कारोबार की सहायता', 'Micro-enterprise subsidy').replace('अस्पताल प्रसव प्रोत्साहन', 'Hospital delivery incentive').replace('महिला स्वास्थ्य जाँच शिविर', "Free women's health check-up camps").replace('बालिका उच्च शिक्षा छात्रवृत्ति', "Girls' higher-education scholarship");
    const whoHi: Record<string, string> = {
      'SCH-041': '60 से 120 वर्ष की महिला, जिसके पास BPL कार्ड है।',
      'SCH-042': '18 से 59 वर्ष की अलग रह रही महिला, जिसके पास BPL कार्ड है।',
      'SCH-051': 'पंजीकृत स्वयं सहायता समूह की सदस्य।',
      'SCH-052': '18 से 40 वर्ष की महिला।',
      'SCH-053': '18 से 55 वर्ष की महिला।',
      'SCH-061': 'गर्भवती महिला।',
      'SCH-062': '18 वर्ष या उससे अधिक उम्र की महिला।',
      'SCH-071': '17 से 25 वर्ष की छात्रा, जिसके पास BPL कार्ड है।',
    };
    const content = [
      { lang: 'hi' as const, title: titleHi, benefit: benefitHi, whoCanApply: whoHi[code], documents: ['आधार कार्ड', 'बैंक पासबुक', 'पहचान प्रमाण'], howToApply: 'नज़दीकी सहायता केंद्र पर जाएँ और ऊपर लिखे कागज़ात साथ ले जाएँ।' },
      { lang: 'en' as const, title: englishTitle, benefit: benefitHi, whoCanApply: whoEn, documents: ['Aadhaar card', 'Bank passbook', 'Identity proof'], howToApply: 'Visit the nearest help centre with the documents listed above.' },
    ];
    for (const item of content) await prisma.schemeContent.upsert({ where: { schemeId_lang: { schemeId: scheme.id, lang: item.lang } }, update: isDraft ? { ...item, status: 'DRAFT', origin: 'AI_DRAFT', aiWarnings: [{ code: 'NUMBER_MISSING', message: 'The notice contains 6000 but the draft does not.' }], approvedById: null, approvedAt: null } : { ...item, status: 'APPROVED', origin: 'HUMAN', approvedById: admin.id, approvedAt: publishedAt }, create: { schemeId: scheme.id, ...item, status: isDraft ? 'DRAFT' : 'APPROVED', origin: isDraft ? 'AI_DRAFT' : 'HUMAN', aiWarnings: isDraft ? [{ code: 'NUMBER_MISSING', message: 'The notice contains 6000 but the draft does not.' }] : undefined, approvedById: isDraft ? null : admin.id, approvedAt: isDraft ? null : publishedAt } });
  }

  if (await prisma.receipt.count() === 0) {
    const amounts = [300, 500, 1000, 1000, 1500, 2000, 2500, 5000, 5000, 10000];
    const names = ['Anita Sharma', 'Meena Verma', 'Kavita Singh', 'Rani Patel', 'Pooja Yadav', 'Sunita Kumari', 'सुनीता देवी', 'Farida Khan', 'Neha Joshi', 'Asha Tiwari', 'Rekha Sahu', 'Lata Mishra'];
    for (let i = 1; i <= 30; i++) {
      const donor = await prisma.donor.upsert({ where: { email: `donor${i}@example.org` }, update: {}, create: { name: `${names[(i - 1) % names.length]} ${i}`, email: `donor${i}@example.org`, pan: `ZZZZZ${String(i).padStart(4, '0')}Z`, consentAt, consentVersion: 'v1' } });
      const date = new Date(Date.UTC(2026, 8, 5 + i - 1, 12, 0));
      const donation = await prisma.donation.create({ data: { donorId: donor.id, campaignId: i % 3 === 0 ? (await prisma.campaign.findUniqueOrThrow({ where: { slug: CAMPAIGN.slug } })).id : null, amountPaise: amounts[(i - 1) % amounts.length] * 100, type: i % 5 === 0 ? 'MONTHLY' : 'ONE_TIME', status: 'PAID', idempotencyKey: `seed-${i}-${date.toISOString()}`, paymentRef: `SEED-${i}`, cardCountry: 'IN', paidAt: date, createdAt: date } });
      await issueReceipt(donation.id, { now: date });
    }
    await prisma.donation.create({ data: { donorId: (await prisma.donor.findUniqueOrThrow({ where: { email: 'donor@example.org' } })).id, amountPaise: 10000, type: 'ONE_TIME', status: 'FAILED', idempotencyKey: 'seed-failed', createdAt: new Date() } });
    await prisma.donation.create({ data: { donorId: (await prisma.donor.findUniqueOrThrow({ where: { email: 'donor@example.org' } })).id, amountPaise: 10000, type: 'ONE_TIME', status: 'BLOCKED_FOREIGN', idempotencyKey: 'seed-foreign', cardCountry: 'US', createdAt: new Date() } });
    await prisma.callbackRequest.createMany({ data: [1, 2, 3].map((n) => ({ name: `Demo caller ${n}`, phone: `98765432${String(n).padStart(2, '0')}`, district: 'Bhopal', schemeCodes: ['SCH-014'], consentAt })) });
    await prisma.finderUse.createMany({ data: [1, 2, 3, 4, 5].map((n) => ({ day: new Date(`2026-11-0${n}T00:00:00.000Z`), resultCount: n })) });
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
