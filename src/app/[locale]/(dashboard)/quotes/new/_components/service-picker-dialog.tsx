"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import type { ServiceLite } from "./types";

interface ServicePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (service: ServiceLite) => void;
}

export function ServicePickerDialog({ open, onOpenChange, onSelect }: ServicePickerDialogProps) {
  const t = useTranslations("quotes.builder");
  const tServices = useTranslations("services");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [services, setServices] = useState<ServiceLite[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open && services === null) {
      fetch("/api/services")
        .then((res) => res.json())
        .then((data) => setServices(data.services ?? []));
    }
  }, [open, services]);

  const filtered = (services ?? []).filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addFromPriceList")}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchServices")}
            className="ps-9"
          />
        </div>
        <div className="mt-2 max-h-80 space-y-1 overflow-y-auto">
          {services === null && (
            <p className="py-6 text-center text-sm text-muted-foreground">{tCommon("loading")}</p>
          )}
          {services !== null && filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {services.length === 0 ? tServices("empty.title") : tCommon("noResults")}
            </p>
          )}
          {filtered.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-start text-sm hover:bg-muted"
            >
              <div className="flex flex-col">
                <span className="text-foreground">{service.name}</span>
                <span className="text-xs text-muted-foreground">{service.unit}</span>
              </div>
              <span className="tabular text-foreground">{formatMoney(service.price, locale)}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
