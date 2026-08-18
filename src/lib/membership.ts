export const FREE_VISIBLE_PROFILES = 50;
export const FREE_DAILY_TAPS = 8;
export const UNLIMITED_PRICE_GBP = 10;

export type MembershipTier = "free" | "unlimited";

export type MembershipStatus = {
  tier: MembershipTier;
  isUnlimited: boolean;
  expiresAt: string | null;
  dailyTapsUsed: number;
  dailyTapsRemaining: number;
};

export function isUnlimited(
  tier?: string | null,
  expiresAt?: Date | string | null,
): boolean {
  if (tier !== "unlimited") return false;
  if (!expiresAt) return true;
  const ts = expiresAt instanceof Date ? expiresAt.getTime() : Date.parse(expiresAt);
  return Number.isFinite(ts) ? ts > Date.now() : true;
}

export function tapsStorageKey(userId: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `pidge_taps_${userId}_${day}`;
}

export function monthFromNow(): Date {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}
