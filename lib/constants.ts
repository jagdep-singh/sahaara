export const CONSENT_VERSION = 'v1';

export const DISTRICTS = [
  'Bhopal',
  'Sehore',
  'Raisen',
  'Vidisha',
] as const;

export type District = (typeof DISTRICTS)[number];
