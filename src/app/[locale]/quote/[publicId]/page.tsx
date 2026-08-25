"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, XCircle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatDate, cn } from "@/lib/utils";
import { whatsAppProvider } from "@/lib/whatsapp";
import { toast } from "sonner";

interface PublicQuote {
  publicId: string;
  number: string;
  status: string;
  notes: string | null;
  terms: string | null;
  subtotal: string;
  discountType: string;
  discountValue: string;
  discountTotal: string;
  vatRate: string;
  vatTotal: string;
  total: string;
  issueDate: string;
  validUntil: string | null;
  respondedAt: string | null;
  clientNote: string | null;
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    unit: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
  business: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    logoUrl: string | null;
    currency: string;
  };
  customer: { name: string };
}

const STATUS_VARIANT: Record<string, "neutral" | "primary" | "success" | "warning" | "destructive"> = {
  SENT: "primary",
  VIEWED: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
  EXPIRED: "neutral",
};

export default function PublicQuotePage() {
  const params = useParams<{ publicId: string }>();
  const locale = useLocale();
  const t = useTranslations("publicQuote");
  const tCommon = useTranslations("common");
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [responding, setResponding] = useState(false);
  const [dialogAction, setDialogAction] = useState<"accept" | "reject" | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/quotes/${params.publicId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not-found");
        const data = await res.json();
        if (!cancelled) setQuote(data.quote);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.publicId]);

  async function submitResponse(action: "accept" | "reject") {
    setResponding(true);
    try {
      const res = await fetch(`/api/public/quotes/${params.publicId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "ALREADY_RESPONDED") toast.error(t("alreadyResponded"));
        else if (body.error === "EXPIRED") toast.error(t("expired"));
        else toast.error(t("alreadyResponded"));
        return;
      }
      const body = await res.json();
      setQuote((prev) => (prev ? { ...prev, status: body.status, respondedAt: new Date().toISOString(), clientNote: note } : prev));
      setDialogAction(null);
      toast.success(action === "accept" ? t("accepted") : t("rejected"));
    } finally {
      setResponding(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Skeleton className="mb-6 h-10 w-40" />
        <Skeleton className="mb-4 h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (notFound || !quote) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <h1 className="text-lg font-semibold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Not found</p>
      </div>
    );
  }

  const canRespond = quote.status === "SENT" || quote.status === "VIEWED";
  const currency = quote.business.currency;

  return (
    <div className="min-h-dvh bg-muted/30 pb-16">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {quote.business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={quote.business.logoUrl} alt={quote.business.name} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                {quote.business.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">{quote.business.name}</p>
              {quote.business.phone && <p className="text-xs text-muted-foreground">{quote.business.phone}</p>}
            </div>
          </div>
          <a
            href={`/api/public/quotes/${params.publicId}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            {t("downloadPdf")}
          </a>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-card sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{t("preparedFor")}</p>
              <p className="text-base font-semibold text-foreground">{quote.customer.name}</p>
            </div>
            <div className="text-end">
              <p className="text-lg font-semibold text-primary">{t("quoteNumber")} {quote.number}</p>
              <Badge variant={STATUS_VARIANT[quote.status] ?? "neutral"} className="mt-1">
                {quote.status}
              </Badge>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("issueDate")}</p>
              <p className="tabular text-foreground">{formatDate(quote.issueDate, locale)}</p>
            </div>
            {quote.validUntil && (
              <div>
                <p className="text-xs text-muted-foreground">{t("validUntil")}</p>
                <p className="tabular text-foreground">{formatDate(quote.validUntil, locale)}</p>
              </div>
            )}
          </div>

          <div className="mb-6 divide-y divide-border border-y border-border">
            <div className="flex gap-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span className="flex-1">{t("service")}</span>
              <span className="w-14 text-center">{t("quantity")}</span>
              <span className="w-20 text-end">{t("unitPrice")}</span>
              <span className="w-20 text-end">{t("total")}</span>
            </div>
            {quote.items.map((item) => (
              <div key={item.id} className="flex gap-3 py-3 text-sm">
                <div className="flex-1">
                  <p className="text-foreground">{item.name}</p>
                  {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
                </div>
                <span className="tabular w-14 text-center text-muted-foreground">{item.quantity} {item.unit}</span>
                <span className="tabular w-20 text-end text-muted-foreground">{formatMoney(item.unitPrice, locale, currency)}</span>
                <span className="tabular w-20 text-end text-foreground">{formatMoney(item.lineTotal, locale, currency)}</span>
              </div>
            ))}
          </div>

          <div className="ms-auto mb-6 max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("subtotal")}</span>
              <span className="tabular">{formatMoney(quote.subtotal, locale, currency)}</span>
            </div>
            {Number(quote.discountTotal) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t("discount")}</span>
                <span className="tabular">-{formatMoney(quote.discountTotal, locale, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>{t("vat")} ({(Number(quote.vatRate) * 100).toFixed(0)}%)</span>
              <span className="tabular">{formatMoney(quote.vatTotal, locale, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
              <span>{t("grandTotal")}</span>
              <span className="tabular text-primary">{formatMoney(quote.total, locale, currency)}</span>
            </div>
          </div>

          {quote.terms && (
            <div className="mb-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("terms")}</p>
              <p className="text-sm text-foreground">{quote.terms}</p>
            </div>
          )}
          {quote.notes && (
            <div className="mb-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("notes")}</p>
              <p className="text-sm text-foreground">{quote.notes}</p>
            </div>
          )}

          {!canRespond && quote.respondedAt && (
            <div
              className={cn(
                "rounded-md p-3 text-sm",
                quote.status === "ACCEPTED" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}
            >
              {quote.status === "ACCEPTED" ? t("accepted") : t("rejected")}
              {quote.clientNote && <p className="mt-1 text-foreground">{quote.clientNote}</p>}
            </div>
          )}

          {!canRespond && quote.status === "EXPIRED" && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{t("expired")}</div>
          )}

          {canRespond && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => setDialogAction("accept")}>
                <CheckCircle2 className="h-4 w-4" />
                {t("accept")}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setDialogAction("reject")}>
                <XCircle className="h-4 w-4" />
                {t("reject")}
              </Button>
            </div>
          )}

          {quote.business.phone && (
            <a
              href={whatsAppProvider.buildSendUrl(
                quote.business.phone,
                t("contactMessage", { number: quote.number })
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t("contactUs")}
            </a>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("poweredBy")} Hatzaa</p>
      </div>

      <Dialog open={dialogAction !== null} onOpenChange={(open) => !open && setDialogAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogAction === "accept" ? t("accept") : t("reject")}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={t("leaveNote")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAction(null)} disabled={responding}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={() => dialogAction && submitResponse(dialogAction)}
              loading={responding}
              variant={dialogAction === "reject" ? "destructive" : "primary"}
            >
              {dialogAction === "accept" ? t("accept") : t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
