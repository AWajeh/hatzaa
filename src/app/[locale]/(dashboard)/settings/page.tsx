"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BusinessSettingsForm } from "@/components/settings/business-settings-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { BillingPanel } from "@/components/settings/billing-panel";
import { TeamPanel } from "@/components/settings/team-panel";
import { Skeleton } from "@/components/ui/skeleton";

interface SettingsData {
  business: Record<string, unknown> & { vatRate: string };
  subscription: {
    status: string;
    cancelAtPeriodEnd: boolean;
    plan: { tier: string; name: string; quoteMonthlyLimit: number | null; monthlyPriceIls: string };
  } | null;
  quotesUsed: number;
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = ["billing", "team", "preferences"].includes(tabParam ?? "") ? tabParam! : "business";
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error(tCommon("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("title")}</h1>
      </div>

      {loading || !data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Tabs defaultValue={initialTab}>
          <TabsList>
            <TabsTrigger value="business">{t("tabs.business")}</TabsTrigger>
            <TabsTrigger value="preferences">{t("tabs.preferences")}</TabsTrigger>
            <TabsTrigger value="billing">{t("tabs.billing")}</TabsTrigger>
            <TabsTrigger value="team">{t("tabs.team")}</TabsTrigger>
          </TabsList>
          <TabsContent value="business">
            <BusinessSettingsForm business={data.business} onSaved={load} />
          </TabsContent>
          <TabsContent value="preferences">
            <PreferencesForm business={data.business} onSaved={load} />
          </TabsContent>
          <TabsContent value="billing">
            <BillingPanel subscription={data.subscription} quotesUsed={data.quotesUsed} />
          </TabsContent>
          <TabsContent value="team">
            <TeamPanel isBusinessPlan={data.subscription?.plan.tier === "BUSINESS"} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
