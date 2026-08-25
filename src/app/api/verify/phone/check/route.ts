import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";
import { smsProvider } from "@/lib/sms/provider";
import { otpCodeSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { allowed } = rateLimit(`verify-phone-check:${session.user.id}`, 10, 5 * 60_000);
  if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = otpCodeSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!user.phone) return NextResponse.json({ error: "NO_PHONE" }, { status: 400 });

  const valid = await smsProvider.checkCode(user.phone, parsed.data.code);
  if (!valid) return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data: { phoneVerifiedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
