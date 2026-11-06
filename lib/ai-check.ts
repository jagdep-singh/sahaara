const devanagariDigits = (value: string) =>
  value.replace(/[०-९]/g, (digit) => String('०१२३४५६७८९'.indexOf(digit)));

const numbers = (value: string) =>
  [...devanagariDigits(value).replace(/,(?=\d)/g, '').matchAll(/\d+(?:\.\d+)?/g)]
    .map((m) => m[0])
    .filter((n) => {
      const number = Number(n);
      return number < 1990 || number > 2100;
    });

export type DraftWarning = { code: string; message: string };

export function checkDraft(source: string, draft: unknown): DraftWarning[] {
  const text = typeof draft === 'string' ? draft : JSON.stringify(draft);
  const sourceNumbers = numbers(source);
  const draftNumbers = numbers(text);
  const warnings: DraftWarning[] = [];
  for (const number of sourceNumbers) {
    if (!draftNumbers.includes(number)) {
      warnings.push({ code: 'NUMBER_MISSING', message: `The notice contains ${number} but the draft does not.` });
    }
  }
  for (const number of draftNumbers) {
    if (!sourceNumbers.includes(number)) {
      warnings.push({ code: 'NUMBER_EXTRA', message: `The draft contains ${number} but the notice does not.` });
    }
  }
  const letters = [...text].filter((c) => /[\p{L}]/u.test(c));
  const hindiLetters = letters.filter((c) => /[\u0900-\u097f]/u.test(c));
  if (letters.length > 0 && hindiLetters.length / letters.length < 0.6) {
    warnings.push({ code: 'NOT_HINDI', message: 'The draft contains too few Hindi letters.' });
  }
  for (const phrase of ['गारंटी', 'पक्का मिलेगा', 'ज़रूर मिलेगा', 'जरूर मिलेगा']) {
    if (text.includes(phrase)) warnings.push({ code: 'PROMISE_WORD', message: `The draft contains promise wording: ${phrase}.` });
  }
  return warnings;
}
