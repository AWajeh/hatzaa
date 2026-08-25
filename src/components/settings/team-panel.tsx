"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Users, Trash2, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useLocale } from "next-intl";

interface Member {
  id: string;
  role: string;
  status: string;
  invitedEmail: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null } | null;
}

export function TeamPanel({ isBusinessPlan }: { isBusinessPlan: boolean }) {
  const t = useTranslations("team");
  const tRoles = useTranslations("team.roles");
  const locale = useLocale();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/team");
    if (res.ok) setMembers((await res.json()).members);
  }

  useEffect(() => {
    load();
  }, []);

  if (!isBusinessPlan) {
    return (
      <Card>
        <CardContent className="pt-5">
          <EmptyState icon={Users} title={t("upgradeRequired")} description={t("upgradeRequiredDescription")} />
        </CardContent>
      </Card>
    );
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setLastInviteUrl(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const messages: Record<string, string> = {
          ALREADY_MEMBER: t("errors.alreadyMember"),
          ALREADY_INVITED: t("errors.alreadyInvited"),
          USER_HAS_BUSINESS: t("errors.userHasBusiness"),
          SEAT_LIMIT: t("errors.seatLimit"),
          FORBIDDEN: t("errors.forbidden"),
        };
        toast.error(messages[body.error] ?? t("errors.generic"));
        return;
      }
      setEmail("");
      setLastInviteUrl(body.inviteUrl);
      toast.success(t("invited"));
      load();
    } finally {
      setInviting(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t("removed"));
      load();
    } else {
      toast.error(t("errors.generic"));
    }
  }

  function copyInviteUrl() {
    if (!lastInviteUrl) return;
    navigator.clipboard.writeText(lastInviteUrl);
    toast.success(t("linkCopied"));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("inviteTitle")}</CardTitle>
          <CardDescription>{t("inviteDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="invite-email">{t("email")}</Label>
              <Input
                id="invite-email"
                type="email"
                required
                className="mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="sm:w-40">
              <Label>{t("role")}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "ADMIN" | "MEMBER")}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">{tRoles("MEMBER")}</SelectItem>
                  <SelectItem value="ADMIN">{tRoles("ADMIN")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" loading={inviting}>
              {t("sendInvite")}
            </Button>
          </form>

          {lastInviteUrl && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-muted p-3 text-xs">
              <span className="flex-1 truncate text-muted-foreground">{lastInviteUrl}</span>
              <Button type="button" variant="ghost" size="icon" onClick={copyInviteUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("membersTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!members ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {m.user?.name ?? m.invitedEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.user?.email ?? m.invitedEmail} · {formatDate(m.createdAt, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.status === "PENDING" ? "warning" : "neutral"}>
                    {m.status === "PENDING" ? t("pending") : tRoles(m.role)}
                  </Badge>
                  {m.role !== "OWNER" && (
                    <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
