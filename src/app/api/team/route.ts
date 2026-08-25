import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const { businessId } = await requireBusiness();

    const members = await prisma.businessMember.findMany({
      where: { businessId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        status: m.status,
        invitedEmail: m.invitedEmail,
        createdAt: m.createdAt.toISOString(),
        user: m.user,
      })),
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function POST(req: Request) {
  try {
    const { businessId, role, session } = await requireBusiness();
    if (role !== "OWNER") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { allowed } = rateLimit(`team-invite:${businessId}`, 20, 60_000);
    if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

    const json = await req.json().catch(() => null);
    const parsed = inviteSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });

    const email = parsed.data.email.toLowerCase().trim();

    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
      include: { plan: true },
    });
    const features = (subscription?.plan.features ?? {}) as { team?: boolean; seats?: number };
    if (!features.team) {
      return NextResponse.json({ error: "PLAN_LIMIT", message: "Team members require the Business plan" }, { status: 402 });
    }

    const existingCount = await prisma.businessMember.count({ where: { businessId } });
    if (features.seats && existingCount >= features.seats) {
      return NextResponse.json({ error: "SEAT_LIMIT", limit: features.seats }, { status: 402 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const alreadyMember = await prisma.businessMember.findFirst({
        where: { businessId, userId: existingUser.id },
      });
      if (alreadyMember) {
        return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });
      }
      const alreadyElsewhere = await prisma.businessMember.findFirst({
        where: { userId: existingUser.id, status: "ACTIVE" },
      });
      if (alreadyElsewhere) {
        return NextResponse.json({ error: "USER_HAS_BUSINESS" }, { status: 409 });
      }
    }

    const existingInvite = await prisma.businessMember.findFirst({
      where: { businessId, invitedEmail: email, status: "PENDING" },
    });
    if (existingInvite) {
      return NextResponse.json({ error: "ALREADY_INVITED" }, { status: 409 });
    }

    const inviteToken = nanoid(24);
    const member = await prisma.businessMember.create({
      data: {
        businessId,
        role: parsed.data.role,
        status: "PENDING",
        invitedEmail: email,
        inviteToken,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const inviteUrl = `${appUrl}/${session.user.locale ?? "he"}/invite/${inviteToken}`;

    return NextResponse.json({ member: { id: member.id, invitedEmail: email }, inviteUrl }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
