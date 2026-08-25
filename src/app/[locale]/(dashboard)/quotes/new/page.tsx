"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateQuotePricing, type DiscountType } from "@/lib/pricing";
import { formatMoney } from "@/lib/utils";
import { CustomerPicker } from "./_components/customer-picker";
import { LineItemsSection } from "./_components/line-items-section";
import { PricingCard } from "./_components/pricing-card";
import { createLineItem, type BusinessSettings, type CustomerLite, type LineItemDraft } from "./_components/types";

interface CustomerApiItem {
  id: string;
  name: string;
  phone: string | null;
}

interface QuoteItemApiItem {
  serviceId: string | null;
  name: string;
  description: string | null;
  unit: string;
  quantity: string | number;
  unitPrice: string | number;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function NewQuotePage() {
  const t = useTranslations("quotes.builder");
  const tCommon = useTranslations("common");
  const tQuotes = useTranslations("quotes");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const editId = searchParams.get("editId");
  const preselectCustomerId = searchParams.get("customerId");

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [items, setItems] = useState<LineItemDraft[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>("amount");
  const [discountValue, setDiscountValue] = useState(0);
  const [vatPercent, setVatPercent] = useState(17);
  const [validUntil, setValidUntil] = useState("");
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState<"DRAFT" | "SENT" | null>(null);
  const [errors, setErrors] = useState<{ customer?: boolean; items?: boolean }>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [customersRes, businessRes, quoteRes] = await Promise.all([
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/business").then((r) => r.json()),
        editId ? fetch(`/api/quotes/${editId}`).then((r) => r.json()) : Promise.resolve(null),
      ]);
      if (cancelled) return;

      const loadedCustomers: CustomerLite[] = (customersRes.customers ?? []).map(
        (c: CustomerApiItem) => ({ id: c.id, name: c.name, phone: c.phone })
      );
      setCustomers(loadedCustomers);

      const business: BusinessSettings | undefined = businessRes.business;

      if (quoteRes?.quote) {
        const quote = quoteRes.quote;
        setCustomerId(quote.customerId);
        setItems(
          quote.items.map((item: QuoteItemApiItem) =>
            createLineItem({
              serviceId: item.serviceId,
              name: item.name,
              description: item.description ?? "",
              unit: item.unit,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
            })
          )
        );
        setDiscountType(quote.discountType);
        setDiscountValue(Number(quote.discountValue));
        setVatPercent(Number(quote.vatRate) * 100);
        setValidUntil(quote.validUntil ? String(quote.validUntil).slice(0, 10) : "");
        setTerms(quote.terms ?? "");
        setNotes(quote.notes ?? "");
      } else {
        if (preselectCustomerId) setCustomerId(preselectCustomerId);
        if (business) {
          setVatPercent(Number(business.vatRate) * 100);
          setTerms(business.defaultTerms ?? "");
          setValidUntil(
            toDateInputValue(new Date(Date.now() + business.defaultValidityDays * 24 * 60 * 60 * 1000))
          );
        }
      }

      setLoading(false);
    }

    load().catch(() => {
      if (!cancelled) {
        toast.error(tCommon("somethingWentWrong"));
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const pricing = useMemo(
    () =>
      calculateQuotePricing({
        items: items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
        discountType,
        discountValue,
        vatRate: vatPercent / 100,
      }),
    [items, discountType, discountValue, vatPercent]
  );

  async function handleSubmit(status: "DRAFT" | "SENT") {
    const nextErrors: { customer?: boolean; items?: boolean } = {};
    if (!customerId) nextErrors.customer = true;
    if (items.length === 0) nextErrors.items = true;
    setErrors(nextErrors);
    if (nextErrors.customer || nextErrors.items) {
      toast.error(nextErrors.customer ? t("customerRequired") : t("itemsRequired"));
      return;
    }

    setSubmitting(status);
    try {
      const payload = {
        customerId,
        items: items.map((item) => ({
          serviceId: item.serviceId || undefined,
          name: item.name || "-",
          description: item.description || undefined,
          unit: item.unit || "-",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        discountType,
        discountValue,
        vatRate: vatPercent / 100,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        terms: terms || undefined,
        notes: notes || undefined,
        status,
      };

      const res = await fetch(editId ? `/api/quotes/${editId}` : "/api/quotes", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 402) {
        const data = await res.json().catch(() => null);
        toast.error(tQuotes("quotaExceeded", { limit: data?.limit ?? "" }));
        return;
      }

      if (!res.ok) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }

      const data = await res.json();
      router.push(`/quotes/${data.quote.id}`);
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24 lg:pb-6">
      <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("selectCustomer")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerPicker
            customers={customers}
            value={customerId}
            onChange={(id) => {
              setCustomerId(id);
              setErrors((e) => ({ ...e, customer: false }));
            }}
            onCustomerCreated={(customer) => setCustomers((prev) => [customer, ...prev])}
            invalid={errors.customer}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <LineItemsSection
            items={items}
            onChange={(next) => {
              setItems(next);
              setErrors((e) => ({ ...e, items: false }));
            }}
          />
          {errors.items && <p className="mt-2 text-sm text-destructive">{t("itemsRequired")}</p>}
        </CardContent>
      </Card>

      <PricingCard
        pricing={pricing}
        discountType={discountType}
        discountValue={discountValue}
        vatPercent={vatPercent}
        onDiscountTypeChange={setDiscountType}
        onDiscountValueChange={setDiscountValue}
        onVatPercentChange={setVatPercent}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="validUntil">{t("validUntil")}</Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="terms">{t("terms")}</Label>
            <Textarea id="terms" value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="hidden items-center justify-end gap-3 lg:flex">
        <Button
          type="button"
          variant="outline"
          loading={submitting === "DRAFT"}
          disabled={submitting !== null}
          onClick={() => handleSubmit("DRAFT")}
        >
          {t("saveDraft")}
        </Button>
        <Button
          type="button"
          loading={submitting === "SENT"}
          disabled={submitting !== null}
          onClick={() => handleSubmit("SENT")}
        >
          {t("createAndSend")}
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3 shadow-popover lg:hidden">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{t("total")}</span>
          <span className="tabular text-base font-semibold text-foreground">
            {formatMoney(pricing.total, locale)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={submitting === "DRAFT"}
            disabled={submitting !== null}
            onClick={() => handleSubmit("DRAFT")}
          >
            {t("saveDraft")}
          </Button>
          <Button
            type="button"
            size="sm"
            loading={submitting === "SENT"}
            disabled={submitting !== null}
            onClick={() => handleSubmit("SENT")}
          >
            {t("createAndSend")}
          </Button>
        </div>
      </div>
    </div>
  );
}
