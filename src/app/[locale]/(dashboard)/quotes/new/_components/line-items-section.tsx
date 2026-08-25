"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ListPlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateLineTotal } from "@/lib/pricing";
import { formatMoney } from "@/lib/utils";
import { ServicePickerDialog } from "./service-picker-dialog";
import { createLineItem, type LineItemDraft, type ServiceLite } from "./types";

interface LineItemsSectionProps {
  items: LineItemDraft[];
  onChange: (items: LineItemDraft[]) => void;
}

export function LineItemsSection({ items, onChange }: LineItemsSectionProps) {
  const t = useTranslations("quotes.builder");
  const tServices = useTranslations("services");
  const locale = useLocale();
  const [pickerOpen, setPickerOpen] = useState(false);

  function updateItem(key: string, patch: Partial<LineItemDraft>) {
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removeItem(key: string) {
    onChange(items.filter((item) => item.key !== key));
  }

  function addFromService(service: ServiceLite) {
    onChange([
      ...items,
      createLineItem({
        serviceId: service.id,
        name: service.name,
        unit: service.unit,
        unitPrice: Number(service.price),
        quantity: 1,
      }),
    ]);
  }

  function addCustomItem() {
    onChange([...items, createLineItem()]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t("items")}</h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            <ListPlus className="h-4 w-4" />
            {t("addFromPriceList")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addCustomItem}>
            <Plus className="h-4 w-4" />
            {t("customItem")}
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          {t("noItemsYet")}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const lineTotal = calculateLineTotal(item.quantity, item.unitPrice);
            return (
              <div key={item.key} className="rounded-md border border-border p-3">
                <div className="flex items-start gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(item.key, { name: e.target.value })}
                    placeholder={t("item")}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.key)}
                    aria-label={t("removeItem")}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">{t("quantity")}</label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">{tServices("fields.unit")}</label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(item.key, { unit: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">{t("unitPrice")}</label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.key, { unitPrice: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
                  <span className="text-muted-foreground">{t("lineTotal")}</span>
                  <span className="tabular font-medium text-foreground">{formatMoney(lineTotal, locale)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ServicePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(service) => addFromService(service)}
      />
    </div>
  );
}
