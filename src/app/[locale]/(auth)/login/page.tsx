"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { loginSchema } from "@/lib/validations";
import { useRouter, Link } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        toast.error(t("login.title") + ": " + t("errors.invalidCredentials"));
        return;
      }
      const callbackUrl = searchParams.get("callbackUrl");
      router.push(callbackUrl ?? "/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("login.title")}</CardTitle>
        <CardDescription>{t("login.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("fields.email")}</Label>
            <Input id="email" type="email" className="mt-1.5" {...register("email")} invalid={!!errors.email} />
          </div>
          <div>
            <Label htmlFor="password">{t("fields.password")}</Label>
            <Input id="password" type="password" className="mt-1.5" {...register("password")} invalid={!!errors.password} />
          </div>
          <Button type="submit" className="w-full" loading={submitting}>
            {t("login.submit")}
          </Button>
        </form>

        {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              {t("orContinueWith")}
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google")}>
              {t("google")}
            </Button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t("login.createOne")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
