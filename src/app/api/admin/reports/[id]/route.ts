import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// Resolving a report marks it resolved — rows are retained for audit/CSAE review.
export async function DELETE(_req: Request, context: RouteContext) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  if (report.resolvedAt) {
    return NextResponse.json({ ok: true, alreadyResolved: true });
  }

  await prisma.report.update({
    where: { id },
    data: { resolvedAt: new Date(), resolvedById: admin.id },
  });
  return NextResponse.json({ ok: true });
}
