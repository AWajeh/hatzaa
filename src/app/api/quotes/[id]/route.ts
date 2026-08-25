import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { quoteSchema } from "@/lib/validations";
import { calculateQuotePricing } from "@/lib/pricing";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { businessId } = await requireBusiness();
    const { id } = await params;

    const quote = await prisma.quote.findFirst({
      where: { id, businessId },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        customer: true,
        views: { orderBy: { viewedAt: "desc" }, take: 20 },
      },
    });
    if (!quote) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ quote });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { businessId } = await requireBusiness();
    const { id } = await params;

    const existing = await prisma.quote.findFirst({ where: { id, businessId } });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (existing.status !== "DRAFT") {
      return NextResponse.json({ error: "QUOTE_NOT_EDITABLE" }, { status: 409 });
    }

    const json = await req.json().catch(() => null);
    const parsed = quoteSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const customer = await prisma.customer.findFirst({ where: { id: data.customerId, businessId } });
    if (!customer) return NextResponse.json({ error: "CUSTOMER_NOT_FOUND" }, { status: 404 });

    const pricing = calculateQuotePricing({
      items: data.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
      discountType: data.discountType,
      discountValue: data.discountValue,
      vatRate: data.vatRate,
    });

    const quote = await prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });
      return tx.quote.update({
        where: { id },
        data: {
          customerId: data.customerId,
          status: data.status,
          title: data.title || undefined,
          notes: data.notes || undefined,
          terms: data.terms || undefined,
          subtotal: pricing.subtotal,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountTotal: pricing.discountTotal,
          vatRate: data.vatRate,
          vatTotal: pricing.vatTotal,
          total: pricing.total,
          validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
          sentAt: data.status === "SENT" && !existing.sentAt ? new Date() : undefined,
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

    return NextResponse.json({ quote });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { businessId } = await requireBusiness();
    const { id } = await params;

    const existing = await prisma.quote.findFirst({ where: { id, businessId } });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (existing.status !== "DRAFT") {
      return NextResponse.json({ error: "QUOTE_NOT_DELETABLE" }, { status: 409 });
    }

    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
