import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { locationSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid location" },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
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
