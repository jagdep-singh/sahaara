export const rupeesToPaise = (r: number): number => Math.round(r * 100);

export const formatINR = (paise: number): string =>
  '₹' +
  (paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: paise % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  });

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

const below100 = (n: number): string =>
  n < 20
    ? ONES[n]
    : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;

const below1000 = (n: number): string => {
  const h = Math.floor(n / 100);
  const r = n % 100;

  return [h ? `${ONES[h]} Hundred` : '', r ? below100(r) : '']
    .filter(Boolean)
    .join(' ');
};

export function rupeesInWords(rupees: number): string {
  let n = Math.floor(rupees);

  if (n === 0) return 'Zero Rupees Only';

  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  n %= 1e7;

  const lakh = Math.floor(n / 1e5);
  n %= 1e5;

  const thousand = Math.floor(n / 1e3);
  n %= 1e3;

  if (crore) parts.push(`${below1000(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (n) parts.push(below1000(n));

  return `${parts.join(' ')} Rupees Only`;
}
