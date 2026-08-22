import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isUnlimited } from "@/lib/membership";
import { STRIPE_ENABLED, buildCheckoutParams, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!STRIPE_ENABLED) {
    return NextResponse.json(
      { error: "Card payments are not available right now" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      membershipTier: true,
      membershipExpiresAt: true,
      stripeCustomerId: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (isUnlimited(user.membershipTier, user.membershipExpiresAt)) {
    return NextResponse.json({ error: "You already have Unlimited" }, { status: 400 });
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(req.url).origin;

  try {
    const checkout = await getStripe().checkout.sessions.create(
      buildCheckoutParams({
        userId: session.user.id,
        email: user.email,
        customerId: user.stripeCustomerId,
        origin,
      }),
    );

    if (!checkout.url) {
      return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
    }

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
