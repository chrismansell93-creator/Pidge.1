import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Site owners who may oversee the whole site. Configure via the ADMIN_EMAILS
// env var (comma-separated). Falls back to the seeded owner account so the
// dashboard is reachable out of the box in local/dev setups.
const DEFAULT_ADMIN_EMAILS = ["test@example.com"];

export function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  const list = raw
    ? raw
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    : DEFAULT_ADMIN_EMAILS;
  return list;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

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
