"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewCustomerDialog } from "./new-customer-dialog";
import type { CustomerLite } from "./types";

interface CustomerPickerProps {
  customers: CustomerLite[];
  value: string | null;
  onChange: (id: string) => void;
  onCustomerCreated: (customer: CustomerLite) => void;
  invalid?: boolean;
}

export function CustomerPicker({
  customers,
  value,
  onChange,
  onCustomerCreated,
  invalid,
}: CustomerPickerProps) {
  const t = useTranslations("quotes.builder");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = customers.find((c) => c.id === value) ?? null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = customers.filter((c) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return c.name.toLowerCase().includes(needle) || (c.phone ?? "").includes(needle);
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-surface px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          invalid && "border-destructive"
        )}
      >
        <span className={cn("flex items-center gap-2 truncate", !selected && "text-muted-foreground")}>
          <User className="h-4 w-4 shrink-0" />
          {selected ? selected.name : t("chooseCustomer")}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-popover">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchCustomer")}
              className="h-8 w-full rounded-md border border-input bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                {t("chooseCustomer")}
              </p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-start text-sm hover:bg-muted",
                  value === c.id && "bg-primary/10"
                )}
              >
                <span className="text-foreground">{c.name}</span>
                {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
              </button>
            ))}
          </div>
          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setNewCustomerOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
              {t("newCustomer")}
            </button>
          </div>
        </div>
      )}

      <NewCustomerDialog
        open={newCustomerOpen}
        onOpenChange={setNewCustomerOpen}
        onCreated={(customer) => {
          onCustomerCreated(customer);
          onChange(customer.id);
        }}
      />
    </div>
  );
}
