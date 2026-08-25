"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { formatDate, formatMoney } from "@/lib/utils";

type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE";

interface CustomerListItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: CustomerStatus;
  address: string | null;
  notes: string | null;
  _count: { quotes: number };
  quotes: { createdAt: string; total: string; status: string }[];
  totalValue: number;
}

const statusBadgeVariant: Record<CustomerStatus, "neutral" | "success"> = {
  LEAD: "neutral",
  ACTIVE: "success",
  INACTIVE: "neutral",
};

export default function CustomersPage() {
  const t = useTranslations("customers");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [customers, setCustomers] = useState<CustomerListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerListItem | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const fetchCustomers = useCallback(async (q: string) => {
    setLoading(true);
    setError(false);
    try {
      const url = q ? `/api/customers?q=${encodeURIComponent(q)}` : "/api/customers";
      const res = await fetch(url);
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setCustomers(data.customers);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(debouncedSearch);
  }, [debouncedSearch, fetchCustomers]);

  const openAddDialog = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const openEditDialog = (customer: CustomerListItem) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleDelete = async (customer: CustomerListItem) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    const previous = customers;
    setCustomers((current) => current?.filter((c) => c.id !== customer.id) ?? current);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("request failed");
      toast.success(tCommon("deleted"));
    } catch {
      setCustomers(previous);
      toast.error(tCommon("somethingWentWrong"));
    }
  };

  const hasCustomers = customers !== null && customers.length > 0;
  const isEmptyOverall = customers !== null && customers.length === 0 && !debouncedSearch;
  const isEmptySearch = customers !== null && customers.length === 0 && !!debouncedSearch;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={openAddDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tCommon("search")}
          className="ps-9"
        />
      </div>

      {error && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">{tCommon("somethingWentWrong")}</p>
          <Button variant="outline" size="sm" onClick={() => fetchCustomers(debouncedSearch)}>
            {tCommon("tryAgain")}
          </Button>
        </div>
      )}

      {!error && loading && customers === null && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!error && isEmptyOverall && (
        <EmptyState
          icon={Users}
          title={t("empty.title")}
          description={t("empty.description")}
          action={<Button onClick={openAddDialog}>{t("empty.cta")}</Button>}
        />
      )}

      {!error && isEmptySearch && (
        <div className="py-16 text-center text-sm text-muted-foreground">{tCommon("noResults")}</div>
      )}

      {!error && hasCustomers && (
        <>
          <div className="hidden rounded-lg border border-border bg-surface px-5 shadow-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead>{t("table.contact")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.quotesCount")}</TableHead>
                  <TableHead>{t("table.lastQuote")}</TableHead>
                  <TableHead>{t("table.totalValue")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers!.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        {customer.phone && <span className="text-foreground">{customer.phone}</span>}
                        {customer.email && <span className="text-muted-foreground">{customer.email}</span>}
                        {!customer.phone && !customer.email && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[customer.status]}>{t(`status.${customer.status}`)}</Badge>
                    </TableCell>
                    <TableCell className="tabular">{customer._count.quotes}</TableCell>
                    <TableCell className="tabular text-muted-foreground">
                      {customer.quotes[0] ? formatDate(customer.quotes[0].createdAt, locale) : "—"}
                    </TableCell>
                    <TableCell className="tabular">{formatMoney(customer.totalValue, locale)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={tCommon("actions")}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEditDialog(customer)}>
                            {tCommon("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleDelete(customer)}
                            className="text-destructive focus:text-destructive"
                          >
                            {tCommon("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {customers!.map((customer) => (
              <div key={customer.id} className="rounded-lg border border-border bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="block truncate font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {customer.name}
                    </Link>
                    <div className="mt-1 flex flex-col text-sm text-muted-foreground">
                      {customer.phone && <span>{customer.phone}</span>}
                      {customer.email && <span>{customer.email}</span>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={tCommon("actions")}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openEditDialog(customer)}>{tCommon("edit")}</DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleDelete(customer)}
                        className="text-destructive focus:text-destructive"
                      >
                        {tCommon("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                  <Badge variant={statusBadgeVariant[customer.status]}>{t(`status.${customer.status}`)}</Badge>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>
                      {customer._count.quotes} {t("table.quotesCount")}
                    </span>
                    <span className="tabular font-medium text-foreground">
                      {formatMoney(customer.totalValue, locale)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editingCustomer}
        onSuccess={() => fetchCustomers(debouncedSearch)}
      />
    </div>
  );
}
