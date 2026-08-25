import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(100),
  locale: z.enum(["he", "ar", "en"]).default("he"),
});

// Registers a brand-new user directly into the inviting business — used
// only when the invited email has no existing account yet. Deliberately
// does not create a new Business (unlike /api/register), since the whole
// point of an invite is to join an existing one.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`invite-register:${ip}`, 5, 60_000);
  if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const invite = await prisma.businessMember.findUnique({ where: { inviteToken: token } });
  if (!invite || invite.status !== "PENDING" || !invite.invitedEmail) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: invite.invitedEmail } });
  if (existing) {
    return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: invite.invitedEmail!,
        passwordHash,
        locale: parsed.data.locale,
      },
    });
    await tx.businessMember.update({
      where: { id: invite.id },
      data: { userId: created.id, status: "ACTIVE", acceptedAt: new Date(), invitedEmail: null, inviteToken: null },
    });
    return created;
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
