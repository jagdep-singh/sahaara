import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { createHmac, randomUUID } from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { PrismaClient } from '../lib/generated/prisma/client';

function arg(name: string, fallback: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}

const n = Number(arg('n', '500'));
const concurrency = Number(arg('c', '50'));
const baseUrl = arg('base', process.env.LOADTEST_BASE_URL ?? 'http://localhost:3000');
const label = arg('label', 'local load test');
const databaseUrl = process.env.LOADTEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Set LOADTEST_DATABASE_URL to a staging/test database before running the load test.');
}
if (
  /localhost:5433|neon\.tech/.test(databaseUrl) &&
  process.env.LOADTEST_ALLOW_UNSAFE !== '1'
) {
  throw new Error(
    'Refusing to run against the demo database. Use an isolated test database or set LOADTEST_ALLOW_UNSAFE=1 for an explicit local experiment.',
  );
}
if (!Number.isInteger(n) || n < 1 || !Number.isInteger(concurrency) || concurrency < 1) {
  throw new Error('Use positive integer --n and --c values.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const secret = process.env.MOCK_WEBHOOK_SECRET;
if (!secret) throw new Error('MOCK_WEBHOOK_SECRET must be set.');
const webhookSecret = secret;

function signature(raw: string, timestamp: number) {
  return `t=${timestamp},v1=${createHmac('sha256', webhookSecret).update(`${timestamp}.${raw}`).digest('hex')}`;
}

async function pool<T>(items: T[], count: number, fn: (item: T) => Promise<number>) {
  let index = 0;
  const statuses: number[] = [];
  await Promise.all(
    Array.from({ length: count }, async () => {
      while (index < items.length) {
        const item = items[index++];
        statuses.push(await fn(item));
      }
    }),
  );
  return statuses;
}

type TestEvent = {
  eventId: string;
  type: 'payment.succeeded';
  donationId: string;
  paymentRef: string;
  cardCountry: string;
};

const started = Date.now();

const donors = await Promise.all(
  Array.from({ length: n }, (_, i) =>
    prisma.donor.create({
      data: {
        name: `Load Test Donor ${i}`,
        email: `load-${Date.now()}-${i}@example.org`,
        pan: `ZZZZZ${String((i % 9999) + 1).padStart(4, '0')}Z`,
        consentAt: new Date(),
        consentVersion: 'load-test',
      },
    }),
  ),
);

const donations = await Promise.all(
  donors.map((donor, i) =>
    prisma.donation.create({
      data: {
        donorId: donor.id,
        amountPaise: 10000,
        type: 'ONE_TIME',
        idempotencyKey: `load-${randomUUID()}-${i}`,
      },
    }),
  ),
);

const events: TestEvent[] = donations.map((donation) => ({
  eventId: randomUUID(),
  type: 'payment.succeeded',
  donationId: donation.id,
  paymentRef: `LOAD-${randomUUID()}`,
  cardCountry: 'IN',
}));

const latencies: number[] = [];

async function send(event: TestEvent) {
  const raw = JSON.stringify(event);
  const start = performance.now();
  const response = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-signature': signature(raw, Math.floor(Date.now() / 1000)),
    },
    body: raw,
  });
  latencies.push(performance.now() - start);
  return response.status;
}

const phaseA = await pool(events, concurrency, send);
const phaseAOk = phaseA.every((status) => status === 200);

const donationIds = donations.map((donation) => donation.id);
const receipts = await prisma.receipt.findMany({
  where: { donationId: { in: donationIds } },
  select: { donationId: true, number: true, fy: true, seq: true },
});

const beforeDuplicateCount = receipts.length;
const duplicateEvents = events.filter((_, i) => i % 10 === 0);
const phaseB = await pool(duplicateEvents, concurrency, send);
const phaseBOk = phaseB.every((status) => status === 200);
const afterDuplicateCount = await prisma.receipt.count({
  where: { donationId: { in: donationIds } },
});
const duplicatesCreated = afterDuplicateCount - beforeDuplicateCount;

const allReceipts = await prisma.receipt.findMany({ select: { fy: true, seq: true, number: true } });
const byFy = new Map<string, { min: number; max: number; count: number }>();
for (const receipt of allReceipts) {
  const current = byFy.get(receipt.fy) ?? {
    min: Number.POSITIVE_INFINITY,
    max: 0,
    count: 0,
  };
  current.min = Math.min(current.min, receipt.seq);
  current.max = Math.max(current.max, receipt.seq);
  current.count += 1;
  byFy.set(receipt.fy, current);
}

const fyChecks = [...byFy.entries()].map(([fy, value]) => ({
  fy,
  ...value,
  contiguous: value.count === value.max - value.min + 1,
}));
const contiguous = fyChecks.every((check) => check.contiguous);
const distinctNumbers = new Set(allReceipts.map((receipt) => receipt.number)).size;
const distinctOk = distinctNumbers === allReceipts.length;
const receiptCountOk = receipts.length === n;

const sorted = [...latencies].sort((a, b) => a - b);
const percentile = (p: number) =>
  sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
const elapsed = (Date.now() - started) / 1000;
const checksPass =
  phaseAOk &&
  phaseBOk &&
  receiptCountOk &&
  contiguous &&
  distinctOk &&
  duplicatesCreated === 0;

const date = new Date().toISOString();
const result = `\n## Load test ${date}\n\n- label: ${label}\n- n: ${n}\n- concurrency: ${concurrency}\n- base URL: ${baseUrl}\n- total seconds: ${elapsed.toFixed(2)}\n- requests/second: ${(n / elapsed).toFixed(2)}\n- p50 latency ms: ${percentile(0.5).toFixed(1)}\n- p95 latency ms: ${percentile(0.95).toFixed(1)}\n- p99 latency ms: ${percentile(0.99).toFixed(1)}\n- max latency ms: ${(sorted.at(-1) ?? 0).toFixed(1)}\n- Phase A HTTP 200: ${phaseA.filter((status) => status === 200).length}/${phaseA.length}\n- Phase B duplicate events: ${duplicateEvents.length}\n- Phase B HTTP 200: ${phaseB.filter((status) => status === 200).length}/${phaseB.length}\n- receipts created: ${receipts.length}/${n}\n- duplicate receipts created: ${duplicatesCreated}\n- distinct receipt numbers: ${distinctNumbers}/${allReceipts.length}\n- per-FY contiguous: ${contiguous}\n${fyChecks.map((check) => `  - ${check.fy}: ${check.count} receipts, seq ${check.min}-${check.max}, contiguous=${check.contiguous}`).join('\n')}\n- checks: ${checksPass ? 'PASS' : 'FAIL'}\n`;

console.log(result);

const resultsFile = path.join(process.cwd(), 'docs', 'loadtest-results.md');
await mkdir(path.dirname(resultsFile), { recursive: true });
await appendFile(resultsFile, result, 'utf8');

await prisma.$disconnect();

if (!checksPass) process.exitCode = 1;
