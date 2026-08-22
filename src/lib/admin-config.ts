import { normalizeEmail } from "@/lib/email";

// Dev-only fallback so local seed can open the dashboard. Production MUST set
// ADMIN_EMAILS explicitly — an empty allowlist means nobody is admin.
const DEV_ADMIN_EMAILS = ["test@example.com"];

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.PIDGE_FORCE_PROD_ADMIN === "1"
  );
}

export function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((entry) => normalizeEmail(entry))
      .filter(Boolean);
  }
  if (!isProductionRuntime()) {
    return DEV_ADMIN_EMAILS;
  }
  return [];
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const allowlist = adminEmails();
  if (allowlist.length === 0) return false;
  return allowlist.includes(normalizeEmail(email));
}
