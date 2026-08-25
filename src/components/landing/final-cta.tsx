"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCta() {
  const t = useTranslations("landing.finalCta");

  return (
    <section className="border-t border-border bg-primary py-16 text-center sm:py-20">
      <div className="container">
        <h2 className="text-2xl font-semibold text-primary-foreground sm:text-3xl">{t("title")}</h2>
        <p className="mt-3 text-primary-foreground/80">{t("subtitle")}</p>
        <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "mt-7 bg-surface text-primary hover:bg-surface/90")}>
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
