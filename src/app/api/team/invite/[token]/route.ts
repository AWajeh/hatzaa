import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`invite-lookup:${ip}`, 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const invite = await prisma.businessMember.findUnique({
    where: { inviteToken: token },
    include: { business: { select: { name: true, logoUrl: true } } },
  });

  if (!invite || invite.status !== "PENDING") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    invite: {
      businessName: invite.business.name,
      logoUrl: invite.business.logoUrl,
      invitedEmail: invite.invitedEmail,
      role: invite.role,
    },
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`invite-accept:${ip}`, 10, 60_000);
  if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const invite = await prisma.businessMember.findUnique({ where: { inviteToken: token } });
  if (!invite || invite.status !== "PENDING") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (invite.invitedEmail && invite.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "EMAIL_MISMATCH" }, { status: 403 });
  }

  const alreadyElsewhere = await prisma.businessMember.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
  });
  if (alreadyElsewhere) {
    return NextResponse.json({ error: "USER_HAS_BUSINESS" }, { status: 409 });
  }

  await prisma.businessMember.update({
    where: { id: invite.id },
    data: { userId: user.id, status: "ACTIVE", acceptedAt: new Date(), invitedEmail: null, inviteToken: null },
  });

  return NextResponse.json({ ok: true, businessId: invite.businessId });
}
