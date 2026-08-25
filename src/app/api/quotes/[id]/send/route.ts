import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { businessId } = await requireBusiness();
    const { id } = await params;

    const existing = await prisma.quote.findFirst({ where: { id, businessId } });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        status: existing.status === "DRAFT" ? "SENT" : existing.status,
        sentAt: existing.sentAt ?? new Date(),
      },
      include: { customer: true },
    });

    return NextResponse.json({
      quote,
      publicUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quote/${quote.publicId}`,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
