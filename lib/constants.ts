export const DISTRICTS = [
  'Bhopal',
  'Sehore',
  'Raisen',
  'Vidisha',
] as const;

export type District = (typeof DISTRICTS)[number];
