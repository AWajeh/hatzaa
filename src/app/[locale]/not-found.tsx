"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const t = useTranslations("errors.404");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("description")}</p>
      <Link href="/" className={cn(buttonVariants(), "mt-6")}>
        הצעה
      </Link>
    </div>
  );
}
