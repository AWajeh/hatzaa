import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { isAppLocale, localeDirections, defaultLocale } from "@/i18n/config";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function loadFont(locale: string) {
  // Satori (next/og's renderer) can't handle variable fonts, and Noto Sans
  // Arabic's GSUB table uses a contextual-substitution format satori
  // doesn't support at all ("lookupType: 5 - substFormat: 3") — Tajawal
  // (a static, simpler-shaped Arabic font) renders correctly instead. See
  // assets/fonts/README.md.
  const file =
    locale === "ar" ? "Tajawal-Bold.ttf" : locale === "en" ? "Inter-Bold-Static.ttf" : "NotoSansHebrew-Bold-Static.ttf";
  return fs.readFileSync(path.join(process.cwd(), "assets", "fonts", file));
}

export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isAppLocale(locale) ? locale : defaultLocale;
  const t = await getTranslations({ locale: safeLocale, namespace: "meta" });
  const dir = localeDirections[safeLocale];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: dir === "rtl" ? "flex-end" : "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f1420 0%, #16213a 100%)",
          direction: dir,
          fontFamily: "Noto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#4c7cf0",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "white",
            }}
          >
            {t("appName").charAt(0)}
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "white" }}>{t("appName")}</div>
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, color: "white", maxWidth: 900, lineHeight: 1.2 }}>
          {t("tagline")}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto",
          data: loadFont(safeLocale),
          style: "normal",
        },
      ],
    }
  );
}
