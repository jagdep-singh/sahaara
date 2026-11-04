const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function financialYearIST(d: Date): string {
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

export function formatReceiptNumber(
  fy: string,
  seq: number,
  prefix = process.env.RECEIPT_PREFIX ?? '80G',
): string {
  return `${prefix}/${fy}/${String(seq).padStart(6, '0')}`;
}
