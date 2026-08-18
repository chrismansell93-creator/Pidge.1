import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      deletedAt: new Date(),
      email: `deleted+${session.user.id}@pidge.dating`,
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
