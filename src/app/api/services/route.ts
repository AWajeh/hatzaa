import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { serviceSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const { businessId } = await requireBusiness();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const categoryId = url.searchParams.get("categoryId");

    const services = await prisma.service.findMany({
      where: {
        businessId,
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: { name: "asc" },
      include: { category: true },
    });

    return NextResponse.json({ services });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    const { businessId } = await requireBusiness();
    const json = await req.json().catch(() => null);
    const parsed = serviceSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: { ...parsed.data, businessId },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
