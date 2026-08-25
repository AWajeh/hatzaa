import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";
import { smsProvider } from "@/lib/sms/provider";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { allowed } = rateLimit(`verify-phone-send:${session.user.id}`, 5, 5 * 60_000);
  if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!user.phone) return NextResponse.json({ error: "NO_PHONE" }, { status: 400 });
  if (user.phoneVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });

  await smsProvider.sendCode(user.phone);
  return NextResponse.json({ ok: true });
}
