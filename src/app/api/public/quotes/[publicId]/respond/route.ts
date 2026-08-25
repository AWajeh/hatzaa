import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicQuoteRespondSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`respond:${ip}:${publicId}`, 10, 60_000);
  if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = publicQuoteRespondSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });

  const quote = await prisma.quote.findUnique({ where: { publicId } });
  if (!quote) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (quote.status === "ACCEPTED" || quote.status === "REJECTED") {
    return NextResponse.json({ error: "ALREADY_RESPONDED" }, { status: 409 });
  }
  if (quote.status === "DRAFT") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (quote.validUntil && quote.validUntil.getTime() < Date.now()) {
    return NextResponse.json({ error: "EXPIRED" }, { status: 410 });
  }

  const updated = await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: parsed.data.action === "accept" ? "ACCEPTED" : "REJECTED",
      respondedAt: new Date(),
      clientNote: parsed.data.note || undefined,
    },
  });

  return NextResponse.json({ status: updated.status });
}
