import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { locationSchema } from "@/lib/validations";
import { requireActiveUser } from "@/lib/active-user";

export async function POST(req: Request) {
  const active = await requireActiveUser();
  if (active.error) return active.error;

  const body = await req.json().catch(() => null);
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid location" },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: active.user.id },
    data: {
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      city: parsed.data.city ?? undefined,
      isOnline: true,
      lastActiveAt: new Date(),
    },
    select: {
      latitude: true,
      longitude: true,
      city: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
