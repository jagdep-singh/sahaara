import { beforeEach, describe, expect, it } from 'vitest';

import { GET } from '@/app/api/receipts/[token]/pdf/route';
import {
  getReceiptPdfFields,
  renderReceiptPdf,
} from '@/lib/pdf/receipt-pdf';
import { issueReceipt } from '@/lib/receipts';
import {
  makePaidDonation,
  resetDb,
} from '@/tests/helpers/db';

const NOW = new Date('2026-11-05T10:30:00.000Z');

async function makeReceipt() {
  const donation = await makePaidDonation({
    name: 'सुनीता देवी',
    pan: 'ABCDE1234F',
    amountPaise: 500_000,
    paidAt: NOW,
  });

  return issueReceipt(donation.id, { now: NOW });
}

function pdfRequest(token: string, inline = false) {
  const query = inline ? '?inline=1' : '';
  return new Request(
    `http://localhost/api/receipts/${token}/pdf${query}`
  );
}

function requestContext(token: string) {
  return { params: Promise.resolve({ token }) };
}

beforeEach(async () => {
  await resetDb();
});

describe('receipt PDF route', () => {
  it('returns a valid PDF with attachment headers', async () => {
    const receipt = await makeReceipt();
    const response = await GET(
      pdfRequest(receipt.publicToken),
      requestContext(receipt.publicToken)
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/pdf'
    );
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="receipt-000001.pdf"'
    );
    expect(response.headers.get('cache-control')).toBe(
      'private, no-store'
    );

    const body = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(body.slice(0, 4))).toBe('%PDF');
    expect(body.byteLength).toBeGreaterThan(5 * 1024);
  });

  it('supports inline disposition', async () => {
    const receipt = await makeReceipt();
    const response = await GET(
      pdfRequest(receipt.publicToken, true),
      requestContext(receipt.publicToken)
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toBe(
      'inline; filename="receipt-000001.pdf"'
    );
  });

  it('returns 404 for an unknown public token', async () => {
    const response = await GET(
      pdfRequest('missing-token'),
      requestContext('missing-token')
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'NOT_FOUND' });
  });

  it('builds every certificate field from the receipt snapshot', async () => {
    const receipt = await makeReceipt();
    const fields = getReceiptPdfFields(receipt);

    expect(fields).toMatchObject({
      trustName: 'Sahaara Charitable Trust',
      trustPan: 'AAAAA0000A',
      trust80g: '80G-PLACEHOLDER-0000',
      receiptNumber: receipt.number,
      date: '05/11/2026',
      donorName: 'सुनीता देवी',
      donorPan: 'ABCDE1234F',
      amount: '₹5,000.00',
      amountInWords: 'Five Thousand Rupees Only',
      towards: 'General fund',
    });
  });

  it('renders the same receipt twice without errors', async () => {
    const receipt = await makeReceipt();
    const [first, second] = await Promise.all([
      renderReceiptPdf(receipt),
      renderReceiptPdf(receipt),
    ]);

    expect(first.byteLength).toBeGreaterThan(5 * 1024);
    expect(second.byteLength).toBeGreaterThan(5 * 1024);
    expect(new TextDecoder().decode(first.subarray(0, 4))).toBe(
      '%PDF'
    );
    expect(new TextDecoder().decode(second.subarray(0, 4))).toBe(
      '%PDF'
    );
  });
});
