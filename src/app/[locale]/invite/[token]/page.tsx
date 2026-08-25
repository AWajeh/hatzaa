"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface InviteInfo {
  businessName: string;
  logoUrl: string | null;
  invitedEmail: string;
  role: string;
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const { data: authSession, status } = useSession();
  const t = useTranslations("team.invite");
  const tRoles = useTranslations("team.roles");
  const locale = useLocale();
  const router = useRouter();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch(`/api/team/invite/${params.token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const body = await res.json();
        setInvite(body.invite);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.token]);

  async function acceptAsLoggedIn() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/team/invite/${params.token}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error === "EMAIL_MISMATCH" ? t("emailMismatch") : t("error"));
        return;
      }
      toast.success(t("joined"));
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function registerAndJoin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/team/invite/${params.token}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, locale }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error === "EMAIL_TAKEN" ? t("emailTaken") : t("error"));
        return;
      }
      const signInRes = await signIn("credentials", {
        email: invite!.invitedEmail,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        router.push("/login");
        return;
      }
      toast.success(t("joined"));
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (notFound || !invite) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-24 text-center">
        <h1 className="text-lg font-semibold text-foreground">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("notFoundDescription")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title", { business: invite.businessName })}</CardTitle>
          <CardDescription>
            {t("subtitle", { email: invite.invitedEmail, role: tRoles(invite.role) })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "authenticated" ? (
            authSession?.user?.email?.toLowerCase() === invite.invitedEmail.toLowerCase() ? (
              <Button className="w-full" onClick={acceptAsLoggedIn} loading={submitting}>
                {t("accept")}
              </Button>
            ) : (
              <p className="text-sm text-destructive">{t("emailMismatch")}</p>
            )
          ) : (
            <form onSubmit={registerAndJoin} className="space-y-4">
              <div>
                <Label>{t("email")}</Label>
                <Input value={invite.invitedEmail} disabled className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="name">{t("name")}</Label>
                <Input id="name" required className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  className="mt-1.5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" loading={submitting}>
                {t("createAndJoin")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {t("haveAccount")}{" "}
                <Link href={`/login?callbackUrl=/invite/${params.token}`} className="font-medium text-primary hover:underline">
                  {t("loginInstead")}
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
