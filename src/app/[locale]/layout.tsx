import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { localeDirections, isAppLocale, locales, type AppLocale } from "@/i18n/config";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hatzaa.online";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/noto-sans-hebrew/400.css";
import "@fontsource/noto-sans-hebrew/500.css";
import "@fontsource/noto-sans-hebrew/600.css";
import "@fontsource/noto-sans-hebrew/700.css";
import "@fontsource/noto-sans-arabic/400.css";
import "@fontsource/noto-sans-arabic/500.css";
import "@fontsource/noto-sans-arabic/600.css";
import "@fontsource/noto-sans-arabic/700.css";
import "@/styles/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isAppLocale(locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: safeLocale, namespace: "meta" });

  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${APP_URL}/${l}`;
  languages["x-default"] = `${APP_URL}/${routing.defaultLocale}`;

  return {
    metadataBase: new URL(APP_URL),
    title: { default: `${t("appName")} — ${t("tagline")}`, template: `%s — ${t("appName")}` },
    description: t("tagline"),
    alternates: {
      canonical: `${APP_URL}/${safeLocale}`,
      languages,
    },
    openGraph: {
      title: `${t("appName")} — ${t("tagline")}`,
      description: t("tagline"),
      url: `${APP_URL}/${safeLocale}`,
      siteName: t("appName"),
      locale: safeLocale === "he" ? "he_IL" : safeLocale === "ar" ? "ar_IL" : "en_IL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("appName")} — ${t("tagline")}`,
      description: t("tagline"),
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = localeDirections[locale as AppLocale];

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
