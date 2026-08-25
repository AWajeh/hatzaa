"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { preferencesSchema } from "@/lib/validations";
import { Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { localeLabels, locales } from "@/i18n/config";

type PreferencesInput = z.infer<typeof preferencesSchema>;

export function PreferencesForm({
  business,
  onSaved,
}: {
  business: Record<string, unknown> & { vatRate: string };
  onSaved: () => void;
}) {
  const t = useTranslations("settings.preferences");
  const tCommon = useTranslations("common");
  const currentLocale = useLocale();

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<PreferencesInput>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      locale: (business.locale as PreferencesInput["locale"]) ?? currentLocale,
      vatRate: Number(business.vatRate ?? 0.17) * 100,
      quotePrefix: (business.quotePrefix as string) ?? "Q",
      defaultValidityDays: (business.defaultValidityDays as number) ?? 14,
      defaultTerms: (business.defaultTerms as string) ?? "",
    },
  });

  async function onSubmit(values: PreferencesInput) {
    const res = await fetch("/api/settings/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, vatRate: Number(values.vatRate) / 100 }),
    });
    if (!res.ok) {
      toast.error(tCommon("somethingWentWrong"));
      return;
    }
    toast.success(tCommon("saved"));
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="space-y-5 pt-5">
          <div>
            <Label>{t("language")}</Label>
            <Controller
              control={control}
              name="locale"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5 max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locales.map((l) => (
                      <SelectItem key={l} value={l}>
                        {localeLabels[l]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="max-w-xs">
            <Label htmlFor="vatRate">{t("vatRate")}</Label>
            <div className="relative mt-1.5">
              <Input id="vatRate" type="number" step="0.1" min={0} max={100} {...register("vatRate", { valueAsNumber: true })} />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{t("vatRateHelp")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="quotePrefix">{t("quotePrefix")}</Label>
              <Input id="quotePrefix" className="mt-1.5" {...register("quotePrefix")} />
            </div>
            <div>
              <Label htmlFor="defaultValidityDays">{t("defaultValidityDays")}</Label>
              <Input
                id="defaultValidityDays"
                type="number"
                min={1}
                className="mt-1.5"
                {...register("defaultValidityDays", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="defaultTerms">{t("defaultTerms")}</Label>
            <Textarea id="defaultTerms" className="mt-1.5" rows={3} {...register("defaultTerms")} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" loading={isSubmitting}>
            {tCommon("save")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
