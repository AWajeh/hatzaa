# PDF fonts

`NotoSansHebrew-Variable.ttf` and `NotoSansArabic-Variable.ttf` are the
unsubsetted variable-font builds of Google's Noto Sans Hebrew / Noto Sans
Arabic, pulled from the [google/fonts](https://github.com/google/fonts)
repository (SIL Open Font License 1.1 — free for commercial use/redistribution).

They're used only for **server-side PDF generation** (`src/lib/pdf/*`), not
for the website itself (the web UI uses `@fontsource/*` packages instead).
Each file's Google Fonts metadata declares Hebrew-or-Arabic + Latin +
Latin Extended + General Punctuation + Currency Symbols coverage, so a
single registered family renders quote numbers, ₪ amounts, dates and Latin
business names correctly alongside Hebrew/Arabic text — unlike the
`@fontsource` webfont chunks, which are deliberately split per Unicode
range for browser download size and do NOT include digits/Latin on their
own.

To refresh these files, re-download from:

- `https://raw.githubusercontent.com/google/fonts/main/ofl/notosanshebrew/NotoSansHebrew%5Bwdth%2Cwght%5D.ttf`
- `https://raw.githubusercontent.com/google/fonts/main/ofl/notosansarabic/NotoSansArabic%5Bwdth%2Cwght%5D.ttf`

## OG image fonts (static instances)

`NotoSansHebrew-Bold-Static.ttf`, `Inter-Bold-Static.ttf`, and
`Tajawal-Bold.ttf` are used only by `src/app/[locale]/opengraph-image.tsx`.
Satori (the renderer behind Next's `ImageResponse`/`next/og`) has two
separate limitations that ruled out reusing the PDF fonts directly:

1. It can't reliably render **variable** fonts — passing the variable
   Hebrew/Arabic/Inter files threw `Cannot read properties of undefined
   (reading '256')`. Fix: instantiate a static single-weight TTF with
   [fonttools](https://github.com/fonttools/fonttools):

   ```bash
   python -m pip install fonttools
   python -m fontTools.varLib.instancer NotoSansHebrew-Variable.ttf wght=700 wdth=100 -o NotoSansHebrew-Bold-Static.ttf
   # Inter-Variable.ttf: download from
   # https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf
   python -m fontTools.varLib.instancer Inter-Variable.ttf wght=700 opsz=32 -o Inter-Bold-Static.ttf
   ```

   Pin every axis the source declares (check with `TTFont(...)['fvar'].axes`)
   — instancer only drops the `fvar` table (making it a true static font)
   once none are left unpinned.

2. Even instantiated statically, **Noto Sans Arabic** still fails with
   `lookupType: 5 - substFormat: 3 is not yet supported` — its GSUB
   contextual-substitution table uses a format satori's shaper doesn't
   implement at all (no font-level fix). `Tajawal-Bold.ttf` (a simpler,
   natively-static Arabic font — download from
   `https://raw.githubusercontent.com/google/fonts/main/ofl/tajawal/Tajawal-Bold.ttf`)
   renders correctly and is used for the Arabic OG image instead. Noto
   Sans Arabic (the variable file) is unaffected and still used for PDFs,
   where `@react-pdf/renderer`'s shaper handles it fine.
