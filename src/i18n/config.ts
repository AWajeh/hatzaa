export const locales = ["he", "ar", "en"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "he";

export const localeDirections: Record<AppLocale, "rtl" | "ltr"> = {
  he: "rtl",
  ar: "rtl",
  en: "ltr",
};

export const localeLabels: Record<AppLocale, string> = {
  he: "עברית",
  ar: "العربية",
  en: "English",
};

// BCP-47 tags used for Intl.NumberFormat / Intl.DateTimeFormat.
export const localeIntlTags: Record<AppLocale, string> = {
  he: "he-IL",
  ar: "ar-IL",
  en: "en-IL",
};

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}
