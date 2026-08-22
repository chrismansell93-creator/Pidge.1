// Pure allowlist helpers — kept separate from Next.js session guards so unit
// tests do not import next/navigation or next-auth.

const DEV_ADMIN_EMAILS = ["test@example.com"];

function isProductionRuntime(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  }
  // Production/Vercel never uses a hardcoded default — set ADMIN_EMAILS there.
  return isProductionRuntime() ? [] : DEV_ADMIN_EMAILS;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
