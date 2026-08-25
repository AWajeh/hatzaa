import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations";
import { issueOtpCode } from "@/lib/otp";
import { emailProvider } from "@/lib/email/provider";
import { passwordResetEmailHtml } from "@/lib/email/templates";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`forgot-password:${ip}`, 5, 15 * 60_000);
  if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return ok — never reveal whether an email is registered.
  if (user && user.passwordHash) {
    const code = await issueOtpCode(user.id, "PASSWORD_RESET");
    await emailProvider
      .send({
        to: user.email,
        subject:
          user.locale === "en" ? "Reset your password — Hatzaa" : user.locale === "ar" ? "إعادة تعيين كلمة المرور — הצעה" : "איפוס סיסמה — הצעה",
        html: passwordResetEmailHtml(code, user.locale),
      })
      .catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
