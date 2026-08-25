import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";
import { verifyOtpCode } from "@/lib/otp";
import { otpCodeSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { allowed } = rateLimit(`verify-email-check:${session.user.id}`, 10, 5 * 60_000);
  if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = otpCodeSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });

  const result = await verifyOtpCode(session.user.id, "EMAIL_VERIFY", parsed.data.code);
  if (result !== "valid") return NextResponse.json({ error: result.toUpperCase() }, { status: 400 });

  await prisma.user.update({ where: { id: session.user.id }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
