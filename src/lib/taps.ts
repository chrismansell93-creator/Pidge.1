import { prisma } from "@/lib/prisma";
import { FREE_DAILY_TAPS, isUnlimited } from "@/lib/membership";

export function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function countTapsSentToday(userId: string): Promise<number> {
  return prisma.tap.count({
    where: {
      fromUserId: userId,
      createdAt: { gte: startOfUtcDay() },
    },
  });
}

export async function getDailyTapUsage(userId: string): Promise<{
  used: number;
  limit: number | null;
  remaining: number | null;
  isUnlimited: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipTier: true, membershipExpiresAt: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    return { used: 0, limit: FREE_DAILY_TAPS, remaining: FREE_DAILY_TAPS, isUnlimited: false };
  }

  const unlimited = isUnlimited(user.membershipTier, user.membershipExpiresAt);
  const used = await countTapsSentToday(userId);
  if (unlimited) {
    return { used, limit: null, remaining: null, isUnlimited: true };
  }

  return {
    used,
    limit: FREE_DAILY_TAPS,
    remaining: Math.max(0, FREE_DAILY_TAPS - used),
    isUnlimited: false,
  };
}
