import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { phone: true, phoneVerifiedAt: true },
  });

  return NextResponse.json({
    phone: user.phone,
    phoneVerified: Boolean(user.phoneVerifiedAt),
  });
}
