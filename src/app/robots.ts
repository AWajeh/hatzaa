import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hatzaa.online";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/*/dashboard",
        "/*/customers",
        "/*/services",
        "/*/quotes",
        "/*/settings",
        "/*/verify",
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
