import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { serviceCategorySchema } from "@/lib/validations";

export async function GET() {
  try {
    const { businessId } = await requireBusiness();
    const categories = await prisma.serviceCategory.findMany({
      where: { businessId },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    const { businessId } = await requireBusiness();
    const json = await req.json().catch(() => null);
    const parsed = serviceCategorySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const category = await prisma.serviceCategory.create({
      data: { ...parsed.data, businessId },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
