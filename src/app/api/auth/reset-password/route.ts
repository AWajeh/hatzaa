import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations";
import { verifyOtpCode } from "@/lib/otp";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`reset-password:${ip}`, 8, 15 * 60_000);
  if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });

  const result = await verifyOtpCode(user.id, "PASSWORD_RESET", parsed.data.code);
  if (result !== "valid") return NextResponse.json({ error: result.toUpperCase() }, { status: 400 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
