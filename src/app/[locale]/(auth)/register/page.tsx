"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { useRouter, Link } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { locale: locale as RegisterInput["locale"] },
  });

  async function onSubmit(values: RegisterInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "EMAIL_TAKEN") toast.error(t("errors.emailTaken"));
        else toast.error(t("errors.invalidCredentials"));
        return;
      }

      const signInRes = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (signInRes?.error) {
        router.push("/login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("register.title")}</CardTitle>
        <CardDescription>{t("register.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("fields.name")}</Label>
            <Input id="name" className="mt-1.5" {...register("name")} invalid={!!errors.name} />
          </div>
          <div>
            <Label htmlFor="businessName">{t("fields.businessName")}</Label>
            <Input id="businessName" className="mt-1.5" {...register("businessName")} invalid={!!errors.businessName} />
          </div>
          <div>
            <Label htmlFor="email">{t("fields.email")}</Label>
            <Input id="email" type="email" className="mt-1.5" {...register("email")} invalid={!!errors.email} />
          </div>
          <div>
            <Label htmlFor="phone">{t("fields.phone")}</Label>
            <Input id="phone" className="mt-1.5" {...register("phone")} />
          </div>
          <div>
            <Label htmlFor="password">{t("fields.password")}</Label>
            <Input id="password" type="password" className="mt-1.5" {...register("password")} invalid={!!errors.password} />
            {errors.password && <p className="mt-1 text-xs text-destructive">{t("errors.weakPassword")}</p>}
          </div>
          <Button type="submit" className="w-full" loading={submitting}>
            {t("register.submit")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("register.haveAccount")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("register.loginHere")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
