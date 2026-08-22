import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validations";
import { requireActiveUser } from "@/lib/active-user";

export async function POST(req: Request) {
  const active = await requireActiveUser();
  if (active.error) return active.error;

  const parsed = reportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a reason" }, { status: 400 });
  }

  if (parsed.data.targetId === active.user.id) {
    return NextResponse.json({ error: "You cannot report yourself" }, { status: 400 });
  }

  await prisma.report.create({
    data: {
      reporterId: active.user.id,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
