import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { meetupSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetups = await prisma.meetupRequest.findMany({
    where: { createdBy: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(meetups);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = meetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid meetup request" },
      { status: 400 },
    );
  }

  const meetup = await prisma.meetupRequest.create({
    data: {
      createdBy: session.user.id,
      title: parsed.data.title,
      summary: parsed.data.summary,
      date: parsed.data.date,
      time: parsed.data.time,
      location: parsed.data.location ?? null,
      type: parsed.data.type,
    },
  });

  return NextResponse.json({ ok: true, meetup }, { status: 201 });
}
