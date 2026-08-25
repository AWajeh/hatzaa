import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";
import { emailProvider } from "@/lib/email/provider";
import { verificationEmailHtml } from "@/lib/email/templates";
import { issueOtpCode } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { allowed } = rateLimit(`verify-email-send:${session.user.id}`, 5, 5 * 60_000);
  if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });

  const code = await issueOtpCode(user.id, "EMAIL_VERIFY");
  await emailProvider.send({
    to: user.email,
    subject:
      user.locale === "en" ? "Verify your email — Hatzaa" : user.locale === "ar" ? "تأكيد بريدك الإلكتروني — הצעה" : "אימות כתובת האימייל — הצעה",
    html: verificationEmailHtml(code, user.locale),
  });

  return NextResponse.json({ ok: true });
}
