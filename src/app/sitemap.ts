import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.pidge.dating";

// Only the public, unauthenticated legal/marketing pages belong in the
// sitemap — the grid, inbox, and profile pages are private per-user data.
const publicPaths = ["/login", "/register", "/privacy", "/terms", "/safety", "/community", "/support"];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));
}
