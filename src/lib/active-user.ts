import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ActiveUser = { id: string; email: string | null };

type ActiveOk = { user: ActiveUser; error?: undefined };
type ActiveErr = { user?: undefined; error: NextResponse };

/**
 * Resolves the signed-in user and rejects suspended/deleted accounts so JWT
 * sessions cannot keep using the API after an admin suspend or self-delete.
 */
export async function requireActiveUser(): Promise<ActiveOk | ActiveErr> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user: { id: user.id, email: user.email } };
}

/** Server-page guard: redirects unauthenticated or suspended users to login. */
export async function requirePageUser(): Promise<ActiveUser> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, deletedAt: true },
  });
  if (!user || user.deletedAt) redirect("/login");

  return { id: user.id, email: user.email };
}
