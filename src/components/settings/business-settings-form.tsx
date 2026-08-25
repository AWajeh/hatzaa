"use client";

import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { z } from "zod";
import { businessSettingsSchema } from "@/lib/validations";

type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const PROFESSIONS = [
  "RENOVATION_CONTRACTOR",
  "ELECTRICIAN",
  "PLUMBER",
  "AC_TECHNICIAN",
  "PAINTER",
  "FLOORING",
  "CARPENTER",
  "ALUMINUM",
  "BUILDING_CONTRACTOR",
  "EXCAVATION",
  "INSTALLER",
  "TECHNICIAN",
  "OTHER",
] as const;

export function BusinessSettingsForm({
  business,
  onSaved,
}: {
  business: Record<string, unknown>;
  onSaved: () => void;
}) {
  const t = useTranslations("settings.business");
  const tProf = useTranslations("professions");
  const tCommon = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>((business.logoUrl as string) ?? null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BusinessSettingsInput>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      name: (business.name as string) ?? "",
      ownerName: (business.ownerName as string) ?? "",
      profession: (business.profession as BusinessSettingsInput["profession"]) ?? "OTHER",
      email: (business.email as string) ?? "",
      phone: (business.phone as string) ?? "",
      address: (business.address as string) ?? "",
      city: (business.city as string) ?? "",
      taxId: (business.taxId as string) ?? "",
    },
  });

  async function onSubmit(values: BusinessSettingsInput) {
    const res = await fetch("/api/settings/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error(tCommon("somethingWentWrong"));
      return;
    }
    toast.success(tCommon("saved"));
    onSaved();
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (!res.ok) throw new Error();
      const body = await res.json();
      setLogoUrl(body.logoUrl);
      toast.success(tCommon("saved"));
    } catch {
      toast.error(tCommon("somethingWentWrong"));
    } finally {
      setUploading(false);
    }
  }

  async function removeLogo() {
    await fetch("/api/settings/logo", { method: "DELETE" });
    setLogoUrl(null);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="space-y-5 pt-5">
          <div>
            <Label className="mb-2 block">{t("logo")}</Label>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-14 w-14 rounded-lg border border-border object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} loading={uploading}>
                {t("uploadLogo")}
              </Button>
              {logoUrl && (
                <Button type="button" variant="ghost" size="icon" onClick={removeLogo}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">{t("name")}</Label>
              <Input id="name" className="mt-1.5" {...register("name")} invalid={!!errors.name} />
            </div>
            <div>
              <Label htmlFor="ownerName">{t("ownerName")}</Label>
              <Input id="ownerName" className="mt-1.5" {...register("ownerName")} />
            </div>
          </div>

          <div>
            <Label>{t("profession")}</Label>
            <Controller
              control={control}
              name="profession"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {tProf(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" className="mt-1.5" {...register("email")} />
            </div>
            <div>
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" className="mt-1.5" {...register("phone")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="address">{t("address")}</Label>
              <Input id="address" className="mt-1.5" {...register("address")} />
            </div>
            <div>
              <Label htmlFor="city">{t("city")}</Label>
              <Input id="city" className="mt-1.5" {...register("city")} />
            </div>
          </div>

          <div>
            <Label htmlFor="taxId">{t("taxId")}</Label>
            <Input id="taxId" className="mt-1.5 max-w-xs" {...register("taxId")} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" loading={isSubmitting}>
            {t("save")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
