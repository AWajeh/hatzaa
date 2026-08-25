"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PayPalButtons } from "./paypal-buttons";

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
  const router = useRouter();

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
        <div className="grid gap-4 sm:grid-cols-2">
          {(["PRO", "BUSINESS"] as const).map((tier) => (
            <Card key={tier}>
              <CardHeader>
                <CardTitle>{tPricing(`plans.${tier.toLowerCase()}.name`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <PayPalButtons planTier={tier} interval="MONTHLY" onActivated={handleActivated} />
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
