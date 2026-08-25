"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { MessageCircle, Copy, Download } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { whatsAppProvider, buildWhatsAppMessage } from "@/lib/whatsapp";
import type { QuoteStatus } from "@prisma/client";

interface QuoteActionsProps {
  quoteId: string;
  publicId: string;
  status: QuoteStatus;
  businessName: string;
  customerName: string;
  customerPhone: string | null;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export function QuoteActions({
  quoteId,
  publicId,
  status,
  businessName,
  customerName,
  customerPhone,
}: QuoteActionsProps) {
  const t = useTranslations("quotes.detail");
  const tCommon = useTranslations("common");
  const tWhatsapp = useTranslations("whatsapp");
  const router = useRouter();
  const [sending, setSending] = useState(false);

  const publicUrl = `${APP_URL}/quote/${publicId}`;

  async function handleSendWhatsapp() {
    let link = publicUrl;
    if (status === "DRAFT") {
      setSending(true);
      try {
        const res = await fetch(`/api/quotes/${quoteId}/send`, { method: "POST" });
        if (!res.ok) {
          toast.error(tCommon("somethingWentWrong"));
          return;
        }
        const data = await res.json();
        link = data.publicUrl;
        router.refresh();
      } finally {
        setSending(false);
      }
    }
    const message = buildWhatsAppMessage(tWhatsapp.raw("message"), {
      customerName,
      businessName,
      link,
    });
    window.open(whatsAppProvider.buildSendUrl(customerPhone, message), "_blank");
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast.success(t("linkCopied"));
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleSendWhatsapp} loading={sending}>
        <MessageCircle className="h-4 w-4" />
        {t("sendWhatsapp")}
      </Button>
      <Button variant="outline" onClick={handleCopyLink}>
        <Copy className="h-4 w-4" />
        {t("copyLink")}
      </Button>
      <a
        href={`/api/quotes/${quoteId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        <Download className="h-4 w-4" />
        {t("downloadPdf")}
      </a>
    </div>
  );
}
