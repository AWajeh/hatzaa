"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { customerSchema, type CustomerInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomerDialogCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
}

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerDialogCustomer | null;
  onSuccess: () => void;
}

const emptyValues: CustomerInput = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  status: "LEAD",
};

export function CustomerFormDialog({ open, onOpenChange, customer, onSuccess }: CustomerFormDialogProps) {
  const t = useTranslations("customers");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(customer);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      customer
        ? {
            name: customer.name,
            phone: customer.phone ?? "",
            email: customer.email ?? "",
            address: customer.address ?? "",
            notes: customer.notes ?? "",
            status: customer.status,
          }
        : emptyValues
    );
  }, [open, customer, reset]);

  const onSubmit = async (data: CustomerInput) => {
    try {
      const res = await fetch(isEdit ? `/api/customers/${customer!.id}` : "/api/customers", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("request failed");
      toast.success(tCommon("saved"));
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(tCommon("somethingWentWrong"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit") : t("add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-name">{t("fields.name")}</Label>
            <Input id="customer-name" invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer-phone">{t("fields.phone")}</Label>
              <Input id="customer-phone" invalid={!!errors.phone} {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer-email">{t("fields.email")}</Label>
              <Input id="customer-email" type="email" invalid={!!errors.email} {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-address">{t("fields.address")}</Label>
            <Input id="customer-address" invalid={!!errors.address} {...register("address")} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-notes">{t("fields.notes")}</Label>
            <Textarea id="customer-notes" invalid={!!errors.notes} {...register("notes")} />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-status">{t("fields.status")}</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="customer-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEAD">{t("status.LEAD")}</SelectItem>
                    <SelectItem value="ACTIVE">{t("status.ACTIVE")}</SelectItem>
                    <SelectItem value="INACTIVE">{t("status.INACTIVE")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
