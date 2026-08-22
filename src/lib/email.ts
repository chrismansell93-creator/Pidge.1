/** Canonical form for account emails — always trim + lowercase before store/lookup. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
