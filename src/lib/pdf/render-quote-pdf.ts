import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/utils";
import { registerPdfFonts } from "./fonts";
import { QuoteDocument, type QuotePdfData } from "./quote-document";

const LABELS: Record<string, Record<string, string>> = {
  he: {
    quoteNumber: "הצעת מחיר מס'",
    issueDate: "תאריך הצעה",
    validUntil: "בתוקף עד",
    preparedFor: "הוכן עבור",
    service: "שירות",
    unit: "יח'",
    quantity: "כמות",
    unitPrice: "מחיר יחידה",
    total: "סה\"כ",
    subtotal: "סכום ביניים",
    discount: "הנחה",
    vat: "מע\"מ",
    grandTotal: "סה\"כ לתשלום",
    terms: "תנאי תשלום",
    notes: "הערות",
    poweredBy: "הופק באמצעות",
  },
  ar: {
    quoteNumber: "عرض سعر رقم",
    issueDate: "تاريخ العرض",
    validUntil: "صالح حتى",
    preparedFor: "أُعد من أجل",
    service: "الخدمة",
    unit: "وحدة",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    total: "الإجمالي",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    vat: "الضريبة",
    grandTotal: "الإجمالي النهائي",
    terms: "شروط الدفع",
    notes: "ملاحظات",
    poweredBy: "تم الإنشاء بواسطة",
  },
  en: {
    quoteNumber: "Quote #",
    issueDate: "Issue date",
    validUntil: "Valid until",
    preparedFor: "Prepared for",
    service: "Service",
    unit: "Unit",
    quantity: "Qty",
    unitPrice: "Unit price",
    total: "Total",
    subtotal: "Subtotal",
    discount: "Discount",
    vat: "VAT",
    grandTotal: "Total due",
    terms: "Payment terms",
    notes: "Notes",
    poweredBy: "Generated with",
  },
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  he: { DRAFT: "טיוטה", SENT: "נשלחה", VIEWED: "נפתחה", ACCEPTED: "אושרה", REJECTED: "נדחתה", EXPIRED: "פג תוקף" },
  ar: { DRAFT: "مسودة", SENT: "أُرسل", VIEWED: "شوهد", ACCEPTED: "قُبل", REJECTED: "رُفض", EXPIRED: "منتهي الصلاحية" },
  en: { DRAFT: "Draft", SENT: "Sent", VIEWED: "Viewed", ACCEPTED: "Accepted", REJECTED: "Rejected", EXPIRED: "Expired" },
};

export async function renderQuotePdf(quoteId: string): Promise<Buffer> {
  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customer: true,
      business: true,
    },
  });

  registerPdfFonts();

  const locale = quote.business.locale;
  const labels = LABELS[locale] ?? LABELS.he!;
  const currency = quote.business.currency;

  const data: QuotePdfData = {
    locale,
    number: quote.number,
    status: STATUS_LABELS[locale]?.[quote.status] ?? quote.status,
    issueDate: formatDate(quote.issueDate, locale),
    validUntil: quote.validUntil ? formatDate(quote.validUntil, locale) : null,
    business: {
      name: quote.business.name,
      ownerName: quote.business.ownerName,
      email: quote.business.email,
      phone: quote.business.phone,
      address: quote.business.address,
      city: quote.business.city,
      taxId: quote.business.taxId,
      logoUrl: quote.business.logoUrl,
    },
    customer: {
      name: quote.customer.name,
      phone: quote.customer.phone,
      email: quote.customer.email,
      address: quote.customer.address,
    },
    items: quote.items.map((item) => ({
      name: item.name,
      description: item.description,
      unit: item.unit,
      quantity: Number(item.quantity).toLocaleString(locale === "en" ? "en-IL" : `${locale}-IL`),
      unitPrice: formatMoney(Number(item.unitPrice), locale, currency),
      lineTotal: formatMoney(Number(item.lineTotal), locale, currency),
    })),
    subtotal: formatMoney(Number(quote.subtotal), locale, currency),
    discountLabel:
      Number(quote.discountTotal) > 0
        ? quote.discountType === "percent"
          ? `${Number(quote.discountValue)}%`
          : formatMoney(Number(quote.discountValue), locale, currency)
        : null,
    discountTotal: formatMoney(Number(quote.discountTotal), locale, currency),
    vatRateLabel: `${(Number(quote.vatRate) * 100).toFixed(0)}%`,
    vatTotal: formatMoney(Number(quote.vatTotal), locale, currency),
    total: formatMoney(Number(quote.total), locale, currency),
    terms: quote.terms,
    notes: quote.notes,
    labels,
  };

  const buffer = await renderToBuffer(QuoteDocument({ data }));
  return buffer;
}
