import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { businessId, role, session } = await requireBusiness();
    if (role !== "OWNER") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;
    const member = await prisma.businessMember.findFirst({ where: { id, businessId } });
    if (!member) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    if (member.userId === session.user.id) {
      return NextResponse.json({ error: "CANNOT_REMOVE_SELF" }, { status: 400 });
    }
    if (member.role === "OWNER") {
      return NextResponse.json({ error: "CANNOT_REMOVE_OWNER" }, { status: 400 });
    }

    await prisma.businessMember.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
