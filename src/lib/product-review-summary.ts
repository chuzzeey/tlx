export const maxManualReviewCount = 2_147_483_647;

export function formatManualReviewCount(value: number | null) {
  return value == null ? '' : new Intl.NumberFormat('en-US').format(value);
}

export function parseManualReviewCountInput(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return { count: null, formatted: '', valid: true };
  }

  const count = Number(digits);
  if (!Number.isSafeInteger(count) || count > maxManualReviewCount) {
    return { count: null, formatted: value, valid: false };
  }

  return { count, formatted: formatManualReviewCount(count), valid: true };
}
