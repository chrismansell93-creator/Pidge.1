import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/active-user";

export async function DELETE() {
  const active = await requireActiveUser();
  if (active.error) return active.error;

  await prisma.user.update({
    where: { id: active.user.id },
    data: {
      deletedAt: new Date(),
      email: `deleted+${active.user.id}@pidge.dating`,
      name: "Deleted user",
      bio: null,
      image: null,
      photos: null,
      headline: null,
      latitude: null,
      longitude: null,
      isOnline: false,
      profileComplete: false,
      passwordHash: null,
    },
  });

  return NextResponse.json({ ok: true });
}
