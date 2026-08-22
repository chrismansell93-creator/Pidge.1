import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.pidge.dating";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/login", "/register", "/privacy", "/terms", "/safety", "/community", "/support"],
        // Everything else is a signed-in user's private grid, chats, profile,
        // or an API route — none of it should be indexed or crawled.
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
