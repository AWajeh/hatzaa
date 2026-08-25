import { useTranslations } from "next-intl";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { QuoteStatus } from "@prisma/client";

const VARIANT_BY_STATUS: Record<QuoteStatus, BadgeProps["variant"]> = {
  DRAFT: "neutral",
  SENT: "primary",
  VIEWED: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
  EXPIRED: "neutral",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const t = useTranslations("quotes.status");
  return <Badge variant={VARIANT_BY_STATUS[status]}>{t(status)}</Badge>;
}
