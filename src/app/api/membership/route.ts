import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FREE_DAILY_TAPS, isUnlimited } from "@/lib/membership";
import { getDailyTapUsage } from "@/lib/taps";

const bodySchema = z.object({
  plan: z.enum(["free"]),
});

export function membershipPayload(user: {
  membershipTier: string;
  membershipExpiresAt: Date | null;
  playPurchaseToken?: string | null;
}) {
  const unlimited = isUnlimited(user.membershipTier, user.membershipExpiresAt);
  return {
    tier: unlimited ? "unlimited" : "free",
    isUnlimited: unlimited,
    expiresAt: user.membershipExpiresAt?.toISOString() ?? null,
    dailyTapsLimit: unlimited ? null : FREE_DAILY_TAPS,
    billed: Boolean(user.playPurchaseToken),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      membershipTier: true,
      membershipExpiresAt: true,
      playPurchaseToken: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const usage = await getDailyTapUsage(session.user.id);
  return NextResponse.json({
    ...membershipPayload(user),
    dailyTapsUsed: usage.used,
    dailyTapsRemaining: usage.remaining,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Unlimited is only sold through Google Play" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      membershipTier: "free",
      membershipExpiresAt: null,
      playPurchaseToken: null,
    },
    select: {
      membershipTier: true,
      membershipExpiresAt: true,
      playPurchaseToken: true,
    },
  });

  return NextResponse.json({ ok: true, ...membershipPayload(updated) });
}
