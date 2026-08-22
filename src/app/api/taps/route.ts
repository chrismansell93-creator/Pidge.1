import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { photosFromUser } from "@/lib/photos";
import { countTapsSentToday, getDailyTapUsage } from "@/lib/taps";
import { FREE_DAILY_TAPS, isUnlimited } from "@/lib/membership";

const createSchema = z.object({
  targetId: z.string().min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usage = await getDailyTapUsage(session.user.id);
  const received = await prisma.tap.findMany({
    where: { toUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          image: true,
          photos: true,
          age: true,
          headline: true,
          deletedAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    ...usage,
    received: received
      .filter((tap) => !tap.fromUser.deletedAt)
      .map((tap) => {
        const photos = photosFromUser(tap.fromUser);
        return {
          id: tap.id,
          createdAt: tap.createdAt.toISOString(),
          from: {
            id: tap.fromUser.id,
            name: tap.fromUser.name ?? "Someone nearby",
            age: tap.fromUser.age,
            image: photos[0] ?? tap.fromUser.image,
            headline: tap.fromUser.headline,
          },
        };
      }),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose someone to tap" }, { status: 400 });
  }

  if (parsed.data.targetId === session.user.id) {
    return NextResponse.json({ error: "You cannot tap yourself" }, { status: 400 });
  }

  const [me, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { membershipTier: true, membershipExpiresAt: true, deletedAt: true },
    }),
    prisma.user.findUnique({
      where: { id: parsed.data.targetId },
      select: { id: true, deletedAt: true, name: true },
    }),
  ]);

  if (!me || me.deletedAt) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!target || target.deletedAt) {
    return NextResponse.json({ error: "That profile is unavailable" }, { status: 404 });
  }

  const unlimited = isUnlimited(me.membershipTier, me.membershipExpiresAt);
  if (!unlimited) {
    const used = await countTapsSentToday(session.user.id);
    if (used >= FREE_DAILY_TAPS) {
      return NextResponse.json(
        { error: "Daily tap limit reached", code: "TAP_LIMIT" },
        { status: 402 },
      );
    }
  }

  try {
    const tap = await prisma.tap.create({
      data: {
        fromUserId: session.user.id,
        toUserId: target.id,
      },
      select: { id: true, createdAt: true },
    });

    const usage = await getDailyTapUsage(session.user.id);
    return NextResponse.json({
      ok: true,
      tap: { id: tap.id, createdAt: tap.createdAt.toISOString(), toUserId: target.id },
      ...usage,
    });
  } catch {
    // Unique constraint — already tapped this person.
    const usage = await getDailyTapUsage(session.user.id);
    return NextResponse.json({
      ok: true,
      alreadyTapped: true,
      ...usage,
    });
  }
}
