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
import { CheckCircle2, LogOut } from "lucide-react";

interface Status {
  email: string;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export default function VerifyPage() {
  const t = useTranslations("verify");
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [submittingEmail, setSubmittingEmail] = useState(false);
  const [submittingPhone, setSubmittingPhone] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendingPhone, setResendingPhone] = useState(false);

  async function loadStatus() {
    const res = await fetch("/api/verify/status");
    if (res.ok) {
      const data = await res.json();
      setStatus(data);
      if (data.emailVerified && data.phoneVerified) {
        router.push("/dashboard");
        router.refresh();
      }
    }
  }

  useEffect(() => {
    loadStatus();
    // Fire initial sends once on mount (registration already triggers
    // these, but resending here is harmless and covers users who land
    // here without a fresh registration, e.g. after a page reload).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitEmailCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingEmail(true);
    try {
      const res = await fetch("/api/verify/email/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: emailCode }),
      });
      if (!res.ok) {
        toast.error(t("invalidCode"));
        return;
      }
      toast.success(t("emailVerified"));
      setEmailCode("");
      loadStatus();
    } finally {
      setSubmittingEmail(false);
    }
  }

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

  async function resendEmail() {
    setResendingEmail(true);
    try {
      await fetch("/api/verify/email/send", { method: "POST" });
      toast.success(t("codeSent"));
    } finally {
      setResendingEmail(false);
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
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>{t("emailLabel", { email: status.email })}</Label>
              {status.emailVerified && <CheckCircle2 className="h-4 w-4 text-success" />}
            </div>
            {!status.emailVerified && (
              <form onSubmit={submitEmailCode} className="flex gap-2">
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                  className="tabular"
                />
                <Button type="submit" loading={submittingEmail} disabled={emailCode.length !== 6}>
                  {t("confirm")}
                </Button>
              </form>
            )}
            {!status.emailVerified && (
              <button type="button" onClick={resendEmail} disabled={resendingEmail} className="mt-1.5 text-xs text-primary hover:underline">
                {t("resend")}
              </button>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>{t("phoneLabel", { phone: status.phone ?? "" })}</Label>
              {status.phoneVerified && <CheckCircle2 className="h-4 w-4 text-success" />}
            </div>
            {!status.phoneVerified && (
              <form onSubmit={submitPhoneCode} className="flex gap-2">
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                  className="tabular"
                />
                <Button type="submit" loading={submittingPhone} disabled={phoneCode.length !== 6}>
                  {t("confirm")}
                </Button>
              </form>
            )}
            {!status.phoneVerified && (
              <button type="button" onClick={resendPhone} disabled={resendingPhone} className="mt-1.5 text-xs text-primary hover:underline">
                {t("resend")}
              </button>
            )}
          </div>
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
