"use client";

import { Toaster as Sonner } from "sonner";
import { useLocale } from "next-intl";
import { localeDirections, type AppLocale } from "@/i18n/config";

export function Toaster() {
  const locale = useLocale() as AppLocale;
  return (
    <Sonner
      dir={localeDirections[locale]}
      position={localeDirections[locale] === "rtl" ? "top-left" : "top-right"}
      toastOptions={{
        classNames: {
          toast: "rounded-lg border border-border bg-surface shadow-popover text-sm",
        },
      }}
    />
  );
}
