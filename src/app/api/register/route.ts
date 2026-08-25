import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { PlanTier, UserRole } from "@prisma/client";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { smsProvider, toE164Israel } from "@/lib/sms/provider";
import { emailProvider } from "@/lib/email/provider";
import { issueOtpCode } from "@/lib/otp";
import { verificationEmailHtml } from "@/lib/email/templates";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`register:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, businessName, email, phone, password, locale } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();
  const e164Phone = toE164Israel(phone);

  const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingEmail) {
    return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
  }
  const existingPhone = await prisma.user.findUnique({ where: { phone: e164Phone } });
  if (existingPhone) {
    return NextResponse.json({ error: "PHONE_TAKEN" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const slugBase = businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9֐-׿؀-ۿ\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  const slug = `${slugBase || "business"}-${nanoid(6)}`;

  const freePlan = await prisma.plan.findUnique({ where: { tier: PlanTier.FREE } });

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone: e164Phone,
        passwordHash,
        locale,
      },
    });

    const business = await tx.business.create({
      data: {
        slug,
        name: businessName,
        ownerName: name,
        email: normalizedEmail,
        phone: e164Phone,
        locale,
        members: { create: { userId: user.id, role: UserRole.OWNER } },
      },
    });

    if (freePlan) {
      await tx.subscription.create({
        data: {
          businessId: business.id,
          planId: freePlan.id,
          status: "TRIALING",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return { user, business };
  });

  // Kick off both verification channels. Failures here shouldn't block
  // registration — the user can resend from the /verify page.
  await Promise.allSettled([
    smsProvider.sendCode(e164Phone),
    issueOtpCode(result.user.id, "EMAIL_VERIFY").then((code) =>
      emailProvider.send({
        to: normalizedEmail,
        subject: locale === "en" ? "Verify your email — Hatzaa" : locale === "ar" ? "تأكيد بريدك الإلكتروني — הצעה" : "אימות כתובת האימייל — הצעה",
        html: verificationEmailHtml(code, locale),
      })
    ),
  ]);

  return NextResponse.json({ id: result.user.id, businessSlug: result.business.slug }, { status: 201 });
}
