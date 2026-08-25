"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { serviceSchema, type ServiceInput } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ServiceCategory {
  id: string;
  name: string;
}

interface ServiceRecord {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  price: string | number;
  categoryId: string | null;
  notes: string | null;
}

interface ServiceFormDialogProps {
  service?: ServiceRecord | null;
  categories: ServiceCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const NO_CATEGORY = "__none__";
const UNIT_KEYS = ["sqm", "meter", "hour", "unit", "day", "job"] as const;

export function ServiceFormDialog({
  service,
  categories,
  open,
  onOpenChange,
  onSuccess,
}: ServiceFormDialogProps) {
  const t = useTranslations("services");
  const tc = useTranslations("common");
  const isEdit = !!service;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      unit: "",
      price: 0,
      categoryId: null,
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: service?.name ?? "",
      description: service?.description ?? "",
      unit: service?.unit ?? "",
      price: service ? Number(service.price) : 0,
      categoryId: service?.categoryId ?? null,
      notes: service?.notes ?? "",
    });
  }, [open, service, reset]);

  const categoryId = watch("categoryId");

  const onSubmit = async (data: ServiceInput) => {
    try {
      const res = await fetch(isEdit ? `/api/services/${service!.id}` : "/api/services", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? t("updated") : t("created"));
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(tc("somethingWentWrong"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit") : t("add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="service-name">{t("fields.name")}</Label>
            <Input id="service-name" invalid={!!errors.name} {...register("name")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service-description">{t("fields.description")}</Label>
            <Textarea
              id="service-description"
              invalid={!!errors.description}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="service-unit">{t("fields.unit")}</Label>
              <Input
                id="service-unit"
                list="service-unit-suggestions"
                invalid={!!errors.unit}
                {...register("unit")}
              />
              <datalist id="service-unit-suggestions">
                {UNIT_KEYS.map((key) => (
                  <option key={key} value={t(`units.${key}`)} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="service-price">{t("fields.price")}</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm text-muted-foreground">
                  {tc("currency")}
                </span>
                <Input
                  id="service-price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="ps-7"
                  invalid={!!errors.price}
                  {...register("price")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service-category">{t("fields.category")}</Label>
            <Select
              value={categoryId ?? NO_CATEGORY}
              onValueChange={(value) => setValue("categoryId", value === NO_CATEGORY ? null : value)}
            >
              <SelectTrigger id="service-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>{t("noCategory")}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service-notes">{t("fields.notes")}</Label>
            <Textarea id="service-notes" invalid={!!errors.notes} {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
