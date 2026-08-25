import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderQuotePdf } from "@/lib/pdf/render-quote-pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;

  const quote = await prisma.quote.findUnique({
    where: { publicId },
    select: { id: true, number: true, status: true },
  });
  if (!quote || quote.status === "DRAFT") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const buffer = await renderQuotePdf(quote.id);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
