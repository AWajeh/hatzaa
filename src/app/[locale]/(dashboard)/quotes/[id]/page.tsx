import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/tenant";
import { formatMoney, formatDate, formatDateTime, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { QuoteStatusBadge } from "../_components/status-badge";
import { QuoteActions } from "./_components/quote-actions";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const { businessId } = await requireBusiness();

  const quote = await prisma.quote.findFirst({
    where: { id, businessId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customer: true,
      views: { orderBy: { viewedAt: "desc" } },
      business: { select: { name: true } },
    },
  });
  if (!quote) notFound();

  const [t, tBuilder] = await Promise.all([
    getTranslations({ locale, namespace: "quotes.detail" }),
    getTranslations({ locale, namespace: "quotes.builder" }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">{quote.number}</h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {quote.customer.name}
            {quote.customer.phone && <> · {quote.customer.phone}</>}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(quote.issueDate, locale)}
            {quote.validUntil && <> · {tBuilder("validUntil")}: {formatDate(quote.validUntil, locale)}</>}
          </p>
        </div>
        <QuoteActions
          quoteId={quote.id}
          publicId={quote.publicId}
          status={quote.status}
          businessName={quote.business.name}
          customerName={quote.customer.name}
          customerPhone={quote.customer.phone}
        />
      </div>

      {quote.status === "DRAFT" && (
        <div className="flex flex-col items-start gap-2 rounded-md border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t("draftNotice")}</p>
          <Link href={`/quotes/new?editId=${quote.id}`} className={cn(buttonVariants({ size: "sm" }))}>
            {t("editDraft")}
          </Link>
        </div>
      )}

      <Card>
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tBuilder("item")}</TableHead>
                <TableHead>{tBuilder("quantity")}</TableHead>
                <TableHead>{tBuilder("unitPrice")}</TableHead>
                <TableHead>{tBuilder("lineTotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-foreground">{item.name}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="tabular">
                    {Number(item.quantity)} {item.unit}
                  </TableCell>
                  <TableCell className="tabular">{formatMoney(Number(item.unitPrice), locale)}</TableCell>
                  <TableCell className="tabular font-medium text-foreground">
                    {formatMoney(Number(item.lineTotal), locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 ms-auto max-w-xs space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{tBuilder("subtotal")}</span>
              <span className="tabular">{formatMoney(Number(quote.subtotal), locale)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{tBuilder("discount")}</span>
              <span className="tabular">-{formatMoney(Number(quote.discountTotal), locale)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{tBuilder("vat")}</span>
              <span className="tabular">{formatMoney(Number(quote.vatTotal), locale)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
              <span>{tBuilder("total")}</span>
              <span className="tabular">{formatMoney(Number(quote.total), locale)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {(quote.terms || quote.notes) && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            {quote.terms && (
              <div>
                <h3 className="text-sm font-semibold text-foreground">{tBuilder("terms")}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{quote.terms}</p>
              </div>
            )}
            {quote.notes && (
              <div>
                <h3 className="text-sm font-semibold text-foreground">{tBuilder("notes")}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{quote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("activity")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {quote.sentAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sentAt")}</span>
              <span className="text-foreground">{formatDateTime(quote.sentAt, locale)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("viewedAt")}</span>
            <span className="text-foreground">
              {quote.lastViewedAt ? formatDateTime(quote.lastViewedAt, locale) : t("notViewedYet")}
            </span>
          </div>
          {quote.views.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("viewCount", { count: quote.views.length })}</span>
            </div>
          )}
          {quote.respondedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("respondedAt")}</span>
              <span className="text-foreground">{formatDateTime(quote.respondedAt, locale)}</span>
            </div>
          )}
          {quote.clientNote && (
            <div>
              <span className="text-muted-foreground">{t("clientNote")}</span>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{quote.clientNote}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
