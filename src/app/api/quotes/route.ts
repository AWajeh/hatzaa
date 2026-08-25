import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { quoteSchema } from "@/lib/validations";
import { calculateQuotePricing } from "@/lib/pricing";
import { assertWithinQuoteQuota, QuotaExceededError } from "@/lib/subscription";
import type { QuoteStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { businessId } = await requireBusiness();
    const url = new URL(req.url);
    const status = url.searchParams.get("status") as QuoteStatus | null;
    const q = url.searchParams.get("q")?.trim();

    const quotes = await prisma.quote.findMany({
      where: {
        businessId,
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { number: { contains: q, mode: "insensitive" } },
                { customer: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });

    return NextResponse.json({ quotes });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    const { businessId } = await requireBusiness();

    await assertWithinQuoteQuota(businessId);

    const json = await req.json().catch(() => null);
    const parsed = quoteSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, businessId },
    });
    if (!customer) return NextResponse.json({ error: "CUSTOMER_NOT_FOUND" }, { status: 404 });

    const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });

    const pricing = calculateQuotePricing({
      items: data.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
      discountType: data.discountType,
      discountValue: data.discountValue,
      vatRate: data.vatRate,
    });

    const quote = await prisma.$transaction(async (tx) => {
      const updatedBusiness = await tx.business.update({
        where: { id: businessId },
        data: { quoteNumberSeq: { increment: 1 } },
      });
      const number = `${business.quotePrefix}-${updatedBusiness.quoteNumberSeq - 1}`;

      const validUntil = data.validUntil
        ? new Date(data.validUntil)
        : new Date(Date.now() + business.defaultValidityDays * 24 * 60 * 60 * 1000);

      return tx.quote.create({
        data: {
          businessId,
          customerId: data.customerId,
          number,
          status: data.status,
          title: data.title || undefined,
          notes: data.notes || undefined,
          terms: data.terms || business.defaultTerms || undefined,
          subtotal: pricing.subtotal,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountTotal: pricing.discountTotal,
          vatRate: data.vatRate,
          vatTotal: pricing.vatTotal,
          total: pricing.total,
          validUntil,
          sentAt: data.status === "SENT" ? new Date() : undefined,
          items: {
            create: data.items.map((item, index) => ({
              serviceId: item.serviceId || undefined,
              sortOrder: index,
              name: item.name,
              description: item.description || undefined,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: pricing.lineTotals[index]!,
            })),
          },
        },
        include: { items: true, customer: true },
      });
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: "QUOTA_EXCEEDED", limit: err.limit }, { status: 402 });
    }
    throw err;
  }
}
