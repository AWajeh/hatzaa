"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { FileText, Plus, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatMoney, formatDateTime } from "@/lib/utils";
import { QuoteStatusBadge } from "./_components/status-badge";
import type { QuoteStatus } from "@prisma/client";

interface QuoteListItem {
  id: string;
  number: string;
  status: QuoteStatus;
  total: string;
  createdAt: string;
  sentAt: string | null;
  lastViewedAt: string | null;
  respondedAt: string | null;
  customer: { id: string; name: string; phone: string | null };
}

const STATUSES: Array<QuoteStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "SENT",
  "VIEWED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
];

export default function QuotesPage() {
  const t = useTranslations("quotes");
  const tStatus = useTranslations("quotes.status");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = (searchParams.get("status") as QuoteStatus | null) ?? "ALL";
  const q = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(q);
  const [quotes, setQuotes] = useState<QuoteListItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  function navigateWithFilters(nextStatus: QuoteStatus | "ALL", nextQ: string) {
    const params = new URLSearchParams();
    if (nextStatus !== "ALL") params.set("status", nextStatus);
    if (nextQ.trim()) params.set("q", nextQ.trim());
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput.trim() !== q) navigateWithFilters(status, searchInput);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (q) params.set("q", q);
    fetch(`/api/quotes?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setQuotes(data.quotes ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, q]);

  function lastActivity(quote: QuoteListItem) {
    return quote.respondedAt ?? quote.lastViewedAt ?? quote.sentAt ?? quote.createdAt;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/quotes/new" className={cn(buttonVariants(), "justify-center")}>
          <Plus className="h-4 w-4" />
          {t("new")}
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => navigateWithFilters(s, searchInput)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                status === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {s === "ALL" ? tStatus("ALL") : tStatus(s)}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("search")}
            className="ps-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !quotes || quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("empty.title")}
          description={t("empty.description")}
          action={
            <Link href="/quotes/new" className={buttonVariants()}>
              {t("empty.cta")}
            </Link>
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.number")}</TableHead>
                <TableHead>{t("table.customer")}</TableHead>
                <TableHead>{t("table.amount")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.date")}</TableHead>
                <TableHead>{t("table.lastActivity")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow
                  key={quote.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                >
                  <TableCell className="font-medium text-foreground">{quote.number}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-foreground">{quote.customer.name}</span>
                      {quote.customer.phone && (
                        <span className="text-xs text-muted-foreground">{quote.customer.phone}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="tabular">{formatMoney(quote.total, locale)}</TableCell>
                  <TableCell>
                    <QuoteStatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(quote.createdAt, locale)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(lastActivity(quote), locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
