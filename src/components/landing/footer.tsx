"use client";

import { useTranslations } from "next-intl";
import { whatsAppProvider } from "@/lib/whatsapp";

const SUPPORT_PHONE = "0523436525";

export function Footer() {
  const t = useTranslations("landing.footer");
  const contactUrl = whatsAppProvider.buildSendUrl(SUPPORT_PHONE, "");

  return (
    <footer className="border-t border-border bg-surface py-10">
      <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="text-sm font-semibold text-foreground">הצעה</span>
        <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
          <span>{t("terms")}</span>
          <span>{t("privacy")}</span>
          <a href={contactUrl} target="_blank" rel="noreferrer" className="hover:text-foreground">
            {t("contact")}
          </a>
        </nav>
        <span className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Hatzaa. {t("rights")}
        </span>
      </div>
    </footer>
  );
}
