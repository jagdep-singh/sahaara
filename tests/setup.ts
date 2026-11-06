import 'dotenv/config';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL must be set');
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.DIRECT_URL = testDatabaseUrl;
process.env.AUTH_SECRET ??=
  'test-auth-secret-000000000000000000000000';
process.env.MOCK_WEBHOOK_SECRET ??= 'test-webhook-secret';
process.env.AI_MODE = 'mock';
process.env.PG_POOL_MAX = '20';
process.env.RECEIPT_PREFIX ??= '80G';
process.env.TRUST_NAME ??= 'Sahaara Charitable Trust';
process.env.TRUST_ADDRESS ??=
  'Placeholder address, Bhopal, Madhya Pradesh';
process.env.TRUST_PAN ??= 'AAAAA0000A';
process.env.TRUST_80G_REG ??= '80G-PLACEHOLDER-0000';
