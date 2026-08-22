import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { FREE_DAILY_TAPS, isUnlimited } from "@/lib/membership";
import { requireActiveUser } from "@/lib/active-user";

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
  const active = await requireActiveUser();
  if (active.error) return active.error;

  const user = await prisma.user.findUnique({
    where: { id: active.user.id },
    select: {
      membershipTier: true,
      membershipExpiresAt: true,
      playPurchaseToken: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(membershipPayload(user));
}

export async function POST(req: Request) {
  const active = await requireActiveUser();
  if (active.error) return active.error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Unlimited is only sold through Google Play" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: active.user.id },
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
