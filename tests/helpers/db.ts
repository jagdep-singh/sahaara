import { prisma } from '@/lib/db';

const TABLES = [
  'receipt',
  'receipt_counter',
  'webhook_event',
  'recurring_plan',
  'donation',
  'donor',
  'campaign',
  'callback_request',
  'finder_use',
  'audit_log',
  'scheme_content',
  'scheme',
  'help_centre',
  'app_user',
].join(', ');

export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES} RESTART IDENTITY CASCADE`,
  );
}
