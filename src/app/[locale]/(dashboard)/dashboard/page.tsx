import { getTranslations } from "next-intl/server";
import { FileText, Send, Eye, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { requireBusiness } from "@/lib/tenant";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { formatMoney, formatDate, formatPercent } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuotesChart } from "@/components/dashboard/quotes-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_VARIANT = {
  DRAFT: "neutral",
  SENT: "primary",
  VIEWED: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
  EXPIRED: "neutral",
} as const;

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { businessId, session } = await requireBusiness();
  const t = await getTranslations("dashboard");
  const tQuotes = await getTranslations("quotes");
  const stats = await getDashboardStats(businessId);

  if (stats.totalQuotesEver === 0) {
    return (
      <div>
        <h1 className="mb-6 text-xl font-semibold text-foreground sm:text-2xl">{t("title")}</h1>
        <EmptyState
          icon={FileText}
          title={t("emptyState.title")}
          description={t("emptyState.description")}
          action={
            <Link href="/quotes/new" className={cn(buttonVariants())}>
              {t("emptyState.cta")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("welcome", { name: session.user.name ?? "" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("stats.quotesThisMonth")} value={String(stats.quotesThisMonth)} icon={FileText} />
        <StatCard label={t("stats.sent")} value={String(stats.sent)} icon={Send} />
        <StatCard label={t("stats.viewed")} value={String(stats.viewed)} icon={Eye} />
        <StatCard label={t("stats.accepted")} value={String(stats.accepted)} icon={CheckCircle2} />
        <StatCard label={t("stats.rejected")} value={String(stats.rejected)} icon={XCircle} />
        <StatCard label={t("stats.totalValue")} value={formatMoney(stats.totalValue, locale)} icon={TrendingUp} />
        <StatCard label={t("stats.acceptanceRate")} value={formatPercent(stats.acceptanceRate, locale)} className="col-span-2 lg:col-span-2" />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-card">
        <QuotesChart data={stats.series} />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-sm font-semibold text-foreground">{t("recentQuotes")}</h2>
          <Link href="/quotes" className="text-sm font-medium text-primary hover:underline">
            {t("viewAll")}
          </Link>
        </div>
        <div className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tQuotes("table.number")}</TableHead>
                <TableHead>{tQuotes("table.customer")}</TableHead>
                <TableHead>{tQuotes("table.amount")}</TableHead>
                <TableHead>{tQuotes("table.status")}</TableHead>
                <TableHead>{tQuotes("table.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentQuotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Link href={`/quotes/${q.id}`} className="font-medium text-foreground hover:underline">
                      {q.number}
                    </Link>
                  </TableCell>
                  <TableCell>{q.customerName}</TableCell>
                  <TableCell className="tabular">{formatMoney(q.total, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[q.status as keyof typeof STATUS_VARIANT] ?? "neutral"}>
                      {tQuotes(`status.${q.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(q.createdAt, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
