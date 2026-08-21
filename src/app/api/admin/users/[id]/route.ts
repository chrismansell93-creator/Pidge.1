import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { monthFromNow } from "@/lib/membership";

type RouteContext = { params: Promise<{ id: string }> };

const actionSchema = z.object({
  action: z.enum(["boost", "unboost", "suspend", "restore", "tier"]),
  tier: z.enum(["free", "unlimited"]).optional(),
});

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown moderation action" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const { action } = parsed.data;

  // Guard against an admin locking themselves out of the site.
  if (action === "suspend" && target.id === admin.id) {
    return NextResponse.json({ error: "You cannot suspend your own account" }, { status: 400 });
  }

  switch (action) {
    case "boost":
      await prisma.user.update({ where: { id }, data: { isBoosted: true } });
      break;
    case "unboost":
      await prisma.user.update({ where: { id }, data: { isBoosted: false } });
      break;
    case "suspend":
      await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), isOnline: false },
      });
      break;
    case "restore":
      await prisma.user.update({ where: { id }, data: { deletedAt: null } });
      break;
    case "tier": {
      const tier = parsed.data.tier ?? "free";
      await prisma.user.update({
        where: { id },
        data: {
          membershipTier: tier,
          membershipExpiresAt: tier === "unlimited" ? monthFromNow() : null,
        },
      });
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
