import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { renderQuotePdf } from "@/lib/pdf/render-quote-pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { businessId } = await requireBusiness();
    const { id } = await params;

    const quote = await prisma.quote.findFirst({ where: { id, businessId }, select: { id: true, number: true } });
    if (!quote) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const buffer = await renderQuotePdf(quote.id);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${quote.number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
