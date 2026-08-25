import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hatzaa.online";

const PUBLIC_PATHS = ["", "/terms", "/privacy", "/login", "/register"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of PUBLIC_PATHS) {
    for (const locale of locales) {
      entries.push({
        url: `${APP_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : 0.5,
        alternates: {
          languages: Object.fromEntries(locales.map((l) => [l, `${APP_URL}/${l}${path}`])),
        },
      });
    }
  }

  return entries;
}
