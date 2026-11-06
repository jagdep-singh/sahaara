import { z } from 'zod';

import { DISTRICTS } from '@/lib/constants';
import { isValidPan, normalizePan } from '@/lib/pan';

export const panSchema = z
  .string()
  .transform(normalizePan)
  .refine(isValidPan, { message: 'PAN is not valid' });

export const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

const nameSchema = z.string().trim().min(2).max(80);
const emailSchema = z.string().trim().email();
const consentSchema = z.literal(true);

const maritalStatusSchema = z.enum([
  'married',
  'widow',
  'single',
  'other',
]);

const yesNoUnsureSchema = z.enum(['yes', 'no', 'unsure']);

const pregnancySchema = z.enum(['no', 'first', 'not_first']);

export const donationInputSchema = z.object({
  amountRupees: z.number().int().min(100).max(1_000_000),
  type: z.enum(['ONE_TIME', 'MONTHLY']),
  campaignSlug: z.string().trim().min(1).max(100).optional(),
  name: nameSchema,
  email: emailSchema,
  phone: mobileSchema.optional(),
  pan: panSchema,
  consent: consentSchema,
  idempotencyKey: z.uuid(),
});

export type DonationInput = z.infer<typeof donationInputSchema>;

export const callbackInputSchema = z.object({
  name: nameSchema,
  phone: mobileSchema,
  district: z.enum(DISTRICTS),
  schemeCodes: z.array(z.string().min(1)).max(20),
  consent: consentSchema,
});

export const finderAnswersSchema = z.object({
  age: z.number().int().min(10).max(100),
  maritalStatus: maritalStatusSchema,
  hasBplCard: yesNoUnsureSchema,
  isShgMember: yesNoUnsureSchema,
  pregnancy: pregnancySchema,
  district: z.string().trim().min(1),
});

const factSchema = z.enum([
  'age',
  'maritalStatus',
  'hasBplCard',
  'isShgMember',
  'pregnancy',
]);

const ruleLabels = {
  labelHi: z.string().trim().min(1),
  labelEn: z.string().trim().min(1),
};

export const ruleSchema = z.discriminatedUnion('op', [
  z.object({
    fact: factSchema,
    op: z.literal('eq'),
    value: z.string().min(1),
    ...ruleLabels,
  }),
  z.object({
    fact: factSchema,
    op: z.literal('in'),
    value: z.array(z.string().min(1)).min(1),
    ...ruleLabels,
  }),
  z.object({
    fact: factSchema,
    op: z.literal('between'),
    value: z.tuple([z.number(), z.number()]),
    ...ruleLabels,
  }),
]);

export const rulesSchema = z.array(ruleSchema);

const documentSchema = z.string().trim().min(1).max(100);

export const schemeContentInputSchema = z.object({
  title: z.string().trim().min(1).max(80),
  benefit: z.string().trim().min(1).max(300),
  whoCanApply: z.string().trim().min(1).max(300),
  documents: z.array(documentSchema).max(10),
  howToApply: z.string().trim().min(1).max(600),
});
