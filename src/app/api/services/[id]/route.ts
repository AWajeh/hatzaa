import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { serviceSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { businessId } = await requireBusiness();
    const { id } = await params;
    const json = await req.json().catch(() => null);
    const parsed = serviceSchema.partial().safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.service.findFirst({ where: { id, businessId } });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const service = await prisma.service.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ service });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { businessId } = await requireBusiness();
    const { id } = await params;

    const existing = await prisma.service.findFirst({ where: { id, businessId } });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    // Soft-delete: quote items may still reference this service historically.
    await prisma.service.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
