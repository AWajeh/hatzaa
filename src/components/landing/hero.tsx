"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  const t = useTranslations("landing.hero");
  const tCommon = useTranslations("landing");

  return (
    <section className="border-b border-border bg-surface">
      <div className="container flex flex-col items-center py-16 text-center sm:py-24">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
            {t("cta")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <a href="#examples" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            {t("secondaryCta")}
          </a>
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          {tCommon("trustedBy")}
        </p>
      </div>
    </section>
  );
}
