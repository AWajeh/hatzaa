import path from "path";
import { Font } from "@react-pdf/renderer";

// Self-hosted Noto Sans Hebrew / Arabic (variable font, default instance),
// each covering Hebrew-or-Arabic + Latin + digits + currency symbols (₪) in
// a single file — see assets/fonts/README.md. This avoids relying on
// @fontsource's per-script webfont subsets (which deliberately exclude
// Latin/digits from their "hebrew"/"arabic" chunks) and avoids a headless
// browser dependency for PDF rendering.

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  const fontsDir = path.join(process.cwd(), "assets", "fonts");

  Font.register({
    family: "NotoSansHebrew",
    src: path.join(fontsDir, "NotoSansHebrew-Variable.ttf"),
  });

  Font.register({
    family: "NotoSansArabic",
    src: path.join(fontsDir, "NotoSansArabic-Variable.ttf"),
  });

  // Hyphenation off — these scripts (and quote content generally) don't
  // benefit from react-pdf's default English hyphenation callback.
  Font.registerHyphenationCallback((word) => [word]);
}

export function pdfFontFamilyFor(locale: string): string {
  return locale === "ar" ? "NotoSansArabic" : "NotoSansHebrew";
}
