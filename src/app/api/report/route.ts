import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = reportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a reason" }, { status: 400 });
  }

  if (parsed.data.targetId === session.user.id) {
    return NextResponse.json({ error: "You cannot report yourself" }, { status: 400 });
  }

  await prisma.report.create({
    data: {
      reporterId: session.user.id,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
