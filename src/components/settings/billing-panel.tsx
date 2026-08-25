"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plan = subscription?.plan;
  const limit = plan?.quoteMonthlyLimit ?? null;

  async function upgrade(tier: "PRO" | "BUSINESS") {
    setLoadingPlan(tier);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier: tier, interval: "MONTHLY" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "PAYMENTS_NOT_CONFIGURED") {
          toast.error("Payments are not configured yet in this environment.");
        } else {
          toast.error("Could not start checkout.");
        }
        return;
      }
      const body = await res.json();
      window.location.href = body.redirectUrl;
    } finally {
      setLoadingPlan(null);
    }
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
        <div className="grid gap-4 sm:grid-cols-2">
          {(["PRO", "BUSINESS"] as const).map((tier) => (
            <Card key={tier}>
              <CardHeader>
                <CardTitle>{tPricing(`plans.${tier.toLowerCase()}.name`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" loading={loadingPlan === tier} onClick={() => upgrade(tier)}>
                  {tPricing("choosePlan")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {plan?.tier !== "FREE" && !subscription?.cancelAtPeriodEnd && (
        <Button variant="outline" onClick={cancel}>
          {t("cancelSubscription")}
        </Button>
      )}
    </div>
  );
}
