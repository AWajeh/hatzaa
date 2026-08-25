"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatMoney } from "@/lib/utils";

const PLAN_PRICES = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 79, yearly: 790 },
  business: { monthly: 199, yearly: 1990 },
} as const;

export function Pricing() {
  const t = useTranslations("landing.pricing");
  const locale = useLocale();
  const [yearly, setYearly] = useState(false);

  const plans = ["free", "pro", "business"] as const;

  return (
    <section id="pricing" className="border-t border-border bg-surface py-16 sm:py-24">
      <div className="container">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{t("title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={cn("text-sm", !yearly ? "text-foreground" : "text-muted-foreground")}>{t("monthly")}</span>
          <button
            onClick={() => setYearly((v) => !v)}
            className="relative h-6 w-11 rounded-full bg-primary/20 transition-colors"
            aria-label="toggle billing interval"
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-primary transition-transform",
                yearly ? "translate-x-0.5 rtl:-translate-x-5" : "translate-x-5 rtl:-translate-x-0.5"
              )}
            />
          </button>
          <span className={cn("text-sm", yearly ? "text-foreground" : "text-muted-foreground")}>
            {t("yearly")} <span className="text-success">({t("yearlyDiscount")})</span>
          </span>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {plans.map((tier) => {
            const popular = tier === "pro";
            const price = PLAN_PRICES[tier][yearly ? "yearly" : "monthly"];
            return (
              <div
                key={tier}
                className={cn(
                  "flex flex-col rounded-lg border bg-background p-6",
                  popular ? "border-primary shadow-card" : "border-border"
                )}
              >
                {popular && (
                  <span className="mb-3 w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {t("mostPopular")}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-foreground">{t(`plans.${tier}.name`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`plans.${tier}.description`)}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tabular text-foreground">
                    {price === 0 ? formatMoney(0, locale) : formatMoney(yearly ? price / 12 : price, locale)}
                  </span>
                  {price > 0 && <span className="text-sm text-muted-foreground">{t("perMonth")}</span>}
                </div>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {(t.raw(`plans.${tier}.features`) as string[]).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={cn(buttonVariants({ variant: popular ? "primary" : "outline" }), "mt-6 w-full")}
                >
                  {t("choosePlan")}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
