"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PayPalButtons } from "./paypal-buttons";
import { cn, formatMoney } from "@/lib/utils";

const PLAN_PRICES = {
  PRO: { MONTHLY: 79, YEARLY: 790 },
  BUSINESS: { MONTHLY: 199, YEARLY: 1990 },
} as const;

interface Subscription {
  status: string;
  cancelAtPeriodEnd: boolean;
  plan: { tier: string; name: string; quoteMonthlyLimit: number | null; monthlyPriceIls: string };
}

export function BillingPanel({
  subscription,
  quotesUsed,
}: {
  subscription: Subscription | null;
  quotesUsed: number;
}) {
  const t = useTranslations("settings.billing");
  const tPricing = useTranslations("landing.pricing");
  const locale = useLocale();
  const router = useRouter();
  const [yearly, setYearly] = useState(false);
  const interval = yearly ? "YEARLY" : "MONTHLY";

  const plan = subscription?.plan;
  const limit = plan?.quoteMonthlyLimit ?? null;

  function handleActivated() {
    // The webhook is the source of truth and typically lands within a few
    // seconds; refresh so the new plan shows up once it has.
    setTimeout(() => router.refresh(), 3000);
  }

  async function cancel() {
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    if (res.ok) toast.success(t("cancelSubscription"));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{t("currentPlan")}</CardTitle>
          <Badge variant="primary">{plan?.name ?? "Free"}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("usage")}: {t("quotesUsed", { used: quotesUsed, limit: limit ?? "" })}
            {limit == null && ` (${t("unlimited")})`}
          </p>
          {subscription?.cancelAtPeriodEnd && (
            <p className="text-sm text-warning">Subscription will end at period close.</p>
          )}
        </CardContent>
      </Card>

      {plan?.tier === "FREE" && (
        <>
          <div className="flex items-center justify-center gap-3">
            <span className={cn("text-sm", !yearly ? "text-foreground" : "text-muted-foreground")}>
              {tPricing("monthly")}
            </span>
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
              {tPricing("yearly")} <span className="text-success">({tPricing("yearlyDiscount")})</span>
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(["PRO", "BUSINESS"] as const).map((tier) => {
              const price = PLAN_PRICES[tier][interval];
              return (
                <Card key={tier}>
                  <CardHeader className="space-y-1">
                    <CardTitle>{tPricing(`plans.${tier.toLowerCase()}.name`)}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="tabular text-2xl font-semibold text-foreground">
                        {formatMoney(yearly ? price / 12 : price, locale)}
                      </span>
                      <span className="text-sm text-muted-foreground">{tPricing("perMonth")}</span>
                    </div>
                    {yearly && (
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(price, locale)} {tPricing("yearly")}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <PayPalButtons planTier={tier} interval={interval} onActivated={handleActivated} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {plan?.tier !== "FREE" && !subscription?.cancelAtPeriodEnd && (
        <Button variant="outline" onClick={cancel}>
          {t("cancelSubscription")}
        </Button>
      )}
    </div>
  );
}
