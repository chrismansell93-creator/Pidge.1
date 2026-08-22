import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FREE_DAILY_TAPS, isUnlimited } from "@/lib/membership";
import { STRIPE_ENABLED, getStripe } from "@/lib/stripe";

const bodySchema = z.object({
  plan: z.enum(["free"]),
});

export function membershipPayload(user: {
  membershipTier: string;
  membershipExpiresAt: Date | null;
  playPurchaseToken?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  const unlimited = isUnlimited(user.membershipTier, user.membershipExpiresAt);
  const source = user.playPurchaseToken
    ? "play"
    : user.stripeSubscriptionId
      ? "stripe"
      : null;
  return {
    tier: unlimited ? "unlimited" : "free",
    isUnlimited: unlimited,
    expiresAt: user.membershipExpiresAt?.toISOString() ?? null,
    dailyTapsLimit: unlimited ? null : FREE_DAILY_TAPS,
    billed: Boolean(user.playPurchaseToken || user.stripeSubscriptionId),
    source,
    stripeEnabled: STRIPE_ENABLED,
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
      stripeSubscriptionId: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(membershipPayload(user));
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

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeSubscriptionId: true },
  });

  if (current?.stripeSubscriptionId && STRIPE_ENABLED) {
    try {
      await getStripe().subscriptions.cancel(current.stripeSubscriptionId);
    } catch {
      // Subscription may already be cancelled or missing upstream; clearing our
      // record below still downgrades the user locally.
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      membershipTier: "free",
      membershipExpiresAt: null,
      playPurchaseToken: null,
      stripeSubscriptionId: null,
    },
    select: {
      membershipTier: true,
      membershipExpiresAt: true,
      playPurchaseToken: true,
      stripeSubscriptionId: true,
    },
  });

  return NextResponse.json({ ok: true, ...membershipPayload(updated) });
}
