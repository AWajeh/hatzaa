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
