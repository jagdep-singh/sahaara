export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const normalizePan = (s: string): string =>
  s.replace(/\s+/g, '').toUpperCase();

export const isValidPan = (s: string): boolean =>
  PAN_REGEX.test(normalizePan(s));

export const maskPan = (p: string): string =>
  `${p.slice(0, 5)}****${p.slice(9)}`;
