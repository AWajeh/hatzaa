"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut } from "lucide-react";

interface Status {
  phone: string | null;
  phoneVerified: boolean;
}

export default function VerifyPage() {
  const t = useTranslations("verify");
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [phoneCode, setPhoneCode] = useState("");
  const [submittingPhone, setSubmittingPhone] = useState(false);
  const [resendingPhone, setResendingPhone] = useState(false);

  async function loadStatus() {
    const res = await fetch("/api/verify/status");
    if (res.ok) {
      const data = await res.json();
      setStatus(data);
      if (data.phoneVerified) {
        router.push("/dashboard");
        router.refresh();
      }
    }
  }

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitPhoneCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingPhone(true);
    try {
      const res = await fetch("/api/verify/phone/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: phoneCode }),
      });
      if (!res.ok) {
        toast.error(t("invalidCode"));
        return;
      }
      toast.success(t("phoneVerified"));
      setPhoneCode("");
      loadStatus();
    } finally {
      setSubmittingPhone(false);
    }
  }

  async function resendPhone() {
    setResendingPhone(true);
    try {
      await fetch("/api/verify/phone/send", { method: "POST" });
      toast.success(t("codeSent"));
    } finally {
      setResendingPhone(false);
    }
  }

  if (!status) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitlePhoneOnly")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>{t("phoneLabel", { phone: status.phone ?? "" })}</Label>
          <form onSubmit={submitPhoneCode} className="mt-1.5 flex gap-2">
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
              className="tabular"
              autoFocus
            />
            <Button type="submit" loading={submittingPhone} disabled={phoneCode.length !== 6}>
              {t("confirm")}
            </Button>
          </form>
          <button type="button" onClick={resendPhone} disabled={resendingPhone} className="mt-2 text-xs text-primary hover:underline">
            {t("resend")}
          </button>
        </CardContent>
      </Card>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-3.5 w-3.5" />
        {t("logout")}
      </button>
    </div>
  );
}
