import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { monthFromNow } from "@/lib/membership";
import { membershipPayload } from "@/app/api/membership/route";
import { verifyPlayPurchase } from "@/lib/play-verify";

const bodySchema = z.object({
  productId: z.string().min(1),
  purchaseToken: z.string().min(8),
  orderId: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Play purchase" }, { status: 400 });
  }

  const verified = await verifyPlayPurchase(parsed.data);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: verified.status });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      membershipTier: "unlimited",
      membershipExpiresAt: monthFromNow(),
      playPurchaseToken: parsed.data.purchaseToken,
    },
    select: {
      membershipTier: true,
      membershipExpiresAt: true,
      playPurchaseToken: true,
    },
  });

  return NextResponse.json({ ok: true, ...membershipPayload(user) });
}
