import crypto from "crypto";
import { prisma } from "@/lib/db";
import type { OtpPurpose } from "@prisma/client";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Creates a new 6-digit code for the user, invalidating any previous
 * unconsumed codes for the same purpose, and returns the plain code to send. */
export async function issueOtpCode(userId: string, purpose: OtpPurpose): Promise<string> {
  const code = generateCode();
  await prisma.$transaction([
    prisma.otpCode.updateMany({
      where: { userId, purpose, consumedAt: null },
      data: { consumedAt: new Date() }, // invalidate stale codes
    }),
    prisma.otpCode.create({
      data: {
        userId,
        purpose,
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    }),
  ]);
  return code;
}

export type OtpCheckResult = "valid" | "invalid" | "expired" | "too_many_attempts" | "not_found";

export async function verifyOtpCode(userId: string, purpose: OtpPurpose, code: string): Promise<OtpCheckResult> {
  const record = await prisma.otpCode.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return "not_found";
  if (record.attempts >= MAX_ATTEMPTS) return "too_many_attempts";
  if (record.expiresAt.getTime() < Date.now()) return "expired";

  if (record.codeHash !== hashCode(code)) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return "invalid";
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return "valid";
}
