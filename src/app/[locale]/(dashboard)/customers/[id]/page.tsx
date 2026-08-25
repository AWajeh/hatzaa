"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Pencil } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { formatDate, formatMoney } from "@/lib/utils";

type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE";
type QuoteStatus = "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "EXPIRED";

interface QuoteSummary {
  id: string;
  number: string;
  status: QuoteStatus;
  total: string;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: CustomerStatus;
  quotes: QuoteSummary[];
}

const customerStatusVariant: Record<CustomerStatus, "neutral" | "success"> = {
  LEAD: "neutral",
  ACTIVE: "success",
  INACTIVE: "neutral",
};

const quoteStatusVariant: Record<QuoteStatus, "neutral" | "primary" | "success" | "warning" | "destructive"> = {
  DRAFT: "neutral",
  SENT: "primary",
  VIEWED: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
  EXPIRED: "neutral",
};

function InfoField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value || "—"}</span>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  const t = useTranslations("customers");
  const tCommon = useTranslations("common");
  const tQuotes = useTranslations("quotes");
  const locale = useLocale();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setCustomer(data.customer);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">{tCommon("somethingWentWrong")}</p>
        <Button variant="outline" size="sm" onClick={fetchCustomer}>
          {tCommon("tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/customers" className="w-fit text-sm text-muted-foreground hover:text-foreground">
        {tCommon("back")}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">{customer.name}</CardTitle>
            <Badge variant={customerStatusVariant[customer.status]}>{t(`status.${customer.status}`)}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Pencil className="h-4 w-4" />
            {tCommon("edit")}
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoField label={t("fields.phone")} value={customer.phone} />
          <InfoField label={t("fields.email")} value={customer.email} />
          <InfoField label={t("fields.address")} value={customer.address} />
          <InfoField label={t("fields.notes")} value={customer.notes} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">{t("history")}</h2>

        {customer.quotes.length === 0 ? (
          <EmptyState
            title={tQuotes("empty.title")}
            description={tQuotes("empty.description")}
            action={
              <Link href={`/quotes/new?customerId=${customer.id}`} className={buttonVariants({ variant: "primary" })}>
                {tQuotes("empty.cta")}
              </Link>
            }
          />
        ) : (
          <div className="rounded-lg border border-border bg-surface px-5 shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tQuotes("table.number")}</TableHead>
                  <TableHead>{tQuotes("table.status")}</TableHead>
                  <TableHead>{tQuotes("table.amount")}</TableHead>
                  <TableHead>{tQuotes("table.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {quote.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={quoteStatusVariant[quote.status]}>{tQuotes(`status.${quote.status}`)}</Badge>
                    </TableCell>
                    <TableCell className="tabular">{formatMoney(quote.total, locale)}</TableCell>
                    <TableCell className="tabular text-muted-foreground">
                      {formatDate(quote.createdAt, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} customer={customer} onSuccess={fetchCustomer} />
    </div>
  );
}
