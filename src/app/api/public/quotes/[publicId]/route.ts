import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;

  const quote = await prisma.quote.findUnique({
    where: { publicId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customer: true,
      business: true,
    },
  });

  if (!quote || quote.status === "DRAFT") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isExpired = quote.validUntil ? quote.validUntil.getTime() < Date.now() : false;
  const effectiveStatus =
    isExpired && (quote.status === "SENT" || quote.status === "VIEWED") ? "EXPIRED" : quote.status;

  const now = new Date();
  const ip = getClientIp(req);
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);

  if (quote.status === "SENT" || quote.status === "VIEWED") {
    await prisma.$transaction([
      prisma.quoteView.create({
        data: {
          quoteId: quote.id,
          ipHash,
          userAgent: req.headers.get("user-agent")?.slice(0, 300),
        },
      }),
      prisma.quote.update({
        where: { id: quote.id },
        data: {
          status: quote.status === "SENT" ? "VIEWED" : quote.status,
          firstViewedAt: quote.firstViewedAt ?? now,
          lastViewedAt: now,
        },
      }),
    ]);
  }

  return NextResponse.json({
    quote: {
      publicId: quote.publicId,
      number: quote.number,
      status: effectiveStatus,
      title: quote.title,
      notes: quote.notes,
      terms: quote.terms,
      subtotal: quote.subtotal.toString(),
      discountType: quote.discountType,
      discountValue: quote.discountValue.toString(),
      discountTotal: quote.discountTotal.toString(),
      vatRate: quote.vatRate.toString(),
      vatTotal: quote.vatTotal.toString(),
      total: quote.total.toString(),
      issueDate: quote.issueDate.toISOString(),
      validUntil: quote.validUntil?.toISOString() ?? null,
      respondedAt: quote.respondedAt?.toISOString() ?? null,
      clientNote: quote.clientNote,
      items: quote.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
      })),
      business: {
        name: quote.business.name,
        phone: quote.business.phone,
        email: quote.business.email,
        address: quote.business.address,
        city: quote.business.city,
        logoUrl: quote.business.logoUrl,
        locale: quote.business.locale,
        currency: quote.business.currency,
      },
      customer: {
        name: quote.customer.name,
      },
    },
  });
}
