export function isUnauthorizedError(error: unknown): boolean {
  if (!error) return false;
  if (!(error instanceof Error)) return false;
  return String(error.message || '').trim().toLowerCase() === 'unauthorized';
}
