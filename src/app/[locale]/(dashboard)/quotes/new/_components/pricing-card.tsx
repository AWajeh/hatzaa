"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatMoney } from "@/lib/utils";
import type { DiscountType, PricingResult } from "@/lib/pricing";

interface PricingCardProps {
  pricing: PricingResult;
  discountType: DiscountType;
  discountValue: number;
  vatPercent: number;
  onDiscountTypeChange: (type: DiscountType) => void;
  onDiscountValueChange: (value: number) => void;
  onVatPercentChange: (value: number) => void;
}

export function PricingCard({
  pricing,
  discountType,
  discountValue,
  vatPercent,
  onDiscountTypeChange,
  onDiscountValueChange,
  onVatPercentChange,
}: PricingCardProps) {
  const t = useTranslations("quotes.builder");
  const locale = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("discount")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex overflow-hidden rounded-md border border-input">
            <button
              type="button"
              onClick={() => onDiscountTypeChange("amount")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors",
                discountType === "amount" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
              )}
            >
              {t("discountAmount")}
            </button>
            <button
              type="button"
              onClick={() => onDiscountTypeChange("percent")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors",
                discountType === "percent" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
              )}
            >
              {t("discountPercent")}
            </button>
          </div>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={discountValue}
            onChange={(e) => onDiscountValueChange(Number(e.target.value) || 0)}
            className="flex-1"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-foreground">{t("vat")} (%)</label>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.1"
            value={vatPercent}
            onChange={(e) => onVatPercentChange(Number(e.target.value) || 0)}
            className="w-28"
          />
        </div>

        <div className="space-y-1.5 border-t border-border pt-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("subtotal")}</span>
            <span className="tabular">{formatMoney(pricing.subtotal, locale)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t("discount")}</span>
            <span className="tabular">-{formatMoney(pricing.discountTotal, locale)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t("vat")}</span>
            <span className="tabular">{formatMoney(pricing.vatTotal, locale)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
            <span>{t("total")}</span>
            <span className="tabular">{formatMoney(pricing.total, locale)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
