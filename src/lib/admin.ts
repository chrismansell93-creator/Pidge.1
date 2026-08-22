import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { adminEmails, isAdminEmail } from "@/lib/admin-emails";

export { adminEmails, isAdminEmail };

export type AdminIdentity = { id: string; email: string };

/**
 * Resolves the current admin from the session, verifying the email against the
 * allowlist using the authoritative value stored in the database. Returns null
 * when the caller is not signed in or is not an admin.
 */
export async function getAdmin(): Promise<AdminIdentity | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, deletedAt: true },
  });
  if (!user || user.deletedAt || !isAdminEmail(user.email)) return null;

  return { id: user.id, email: user.email as string };
}

/** Server-component guard: redirects non-admins to the grid. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getAdmin();
  if (!admin) redirect("/");
  return admin;
}
