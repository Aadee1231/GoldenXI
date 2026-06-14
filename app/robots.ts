import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/auth/callback/",
        "/profile/setup",
        "/debug-profile/",
        "/test-rpc/",
        "/api/",
      ],
    },
    sitemap: "https://goldenxi.vercel.app/sitemap.xml",
  };
}
