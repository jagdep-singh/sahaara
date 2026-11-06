import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { createHmac, randomUUID } from 'node:crypto';

import { PrismaClient } from '../lib/generated/prisma/client';

function arg(name: string, fallback: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

const n = Number(arg('n', '500'));
const concurrency = Number(arg('c', '50'));
const baseUrl = process.env.LOADTEST_BASE_URL ?? 'http://localhost:3000';
const databaseUrl = process.env.LOADTEST_DATABASE_URL;
if (!databaseUrl) throw new Error('Set LOADTEST_DATABASE_URL to a staging/test database before running the load test.');
if (/localhost:5433|neon\.tech/.test(databaseUrl) && process.env.LOADTEST_ALLOW_UNSAFE !== '1') throw new Error('Refusing to run against the demo database. Set LOADTEST_ALLOW_UNSAFE=1 only for an explicit local experiment.');
if (!Number.isInteger(n) || n < 1 || !Number.isInteger(concurrency) || concurrency < 1) throw new Error('Use positive integer --n and --c values.');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const secret = process.env.MOCK_WEBHOOK_SECRET;
if (!secret) throw new Error('MOCK_WEBHOOK_SECRET must be set.');
const webhookSecret = secret;

function signature(raw: string, timestamp: number) {
  return `t=${timestamp},v1=${createHmac('sha256', webhookSecret).update(`${timestamp}.${raw}`).digest('hex')}`;
}

async function pool<T>(items: T[], count: number, fn: (item: T) => Promise<void>) {
  let index = 0;
  await Promise.all(Array.from({ length: count }, async () => { while (index < items.length) { const item = items[index++]; await fn(item); } }));
}

const started = Date.now();
const donors = await Promise.all(Array.from({ length: n }, (_, i) => prisma.donor.create({ data: { name: `Load Test Donor ${i}`, email: `load-${Date.now()}-${i}@example.org`, pan: `ZZZZZ${String((i % 9999) + 1).padStart(4, '0')}Z`, consentAt: new Date(), consentVersion: 'load-test' } })));
const donations = await Promise.all(donors.map((donor, i) => prisma.donation.create({ data: { donorId: donor.id, amountPaise: 10000, type: 'ONE_TIME', idempotencyKey: `load-${randomUUID()}-${i}` } })));
const events = donations.map((donation) => ({ eventId: randomUUID(), type: 'payment.succeeded', donationId: donation.id, paymentRef: `LOAD-${randomUUID()}`, cardCountry: 'IN' }));
const latencies: number[] = [];
const send = async (event: (typeof events)[number]) => { const raw = JSON.stringify(event); const start = performance.now(); const response = await fetch(`${baseUrl}/api/payments/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-webhook-signature': signature(raw, Math.floor(Date.now() / 1000)) }, body: raw }); latencies.push(performance.now() - start); if (response.status !== 200) throw new Error(`Webhook ${event.donationId} returned ${response.status}: ${await response.text()}`); };
await pool(events, concurrency, send);
const sorted = [...latencies].sort((a, b) => a - b);
const percentile = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
const receipts = await prisma.receipt.count({ where: { donationId: { in: donations.map((d) => d.id) } } });
const elapsed = (Date.now() - started) / 1000;
const result = `\n## Load test ${new Date().toISOString()}\n\n- n: ${n}\n- concurrency: ${concurrency}\n- total seconds: ${elapsed.toFixed(2)}\n- requests/second: ${(n / elapsed).toFixed(2)}\n- p50 latency ms: ${percentile(0.50).toFixed(1)}\n- p95 latency ms: ${percentile(0.95).toFixed(1)}\n- p99 latency ms: ${percentile(0.99).toFixed(1)}\n- max latency ms: ${(sorted.at(-1) ?? 0).toFixed(1)}\n- HTTP 200 responses: ${n}\n- receipts created: ${receipts}\n- checks: ${receipts === n ? 'PASS' : 'FAIL'}\n`;
console.log(result);
await prisma.$disconnect();
