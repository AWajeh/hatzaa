import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { customerSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const { businessId } = await requireBusiness();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();

    const customers = await prisma.customer.findMany({
      where: {
        businessId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { quotes: true } },
        quotes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, total: true, status: true },
        },
      },
    });

    const totals = await prisma.quote.groupBy({
      by: ["customerId"],
      where: { businessId, customerId: { in: customers.map((c) => c.id) } },
      _sum: { total: true },
    });
    const totalValueByCustomer = new Map(totals.map((t) => [t.customerId, Number(t._sum.total ?? 0)]));

    return NextResponse.json({
      customers: customers.map((c) => ({
        ...c,
        totalValue: totalValueByCustomer.get(c.id) ?? 0,
      })),
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    const { businessId } = await requireBusiness();
    const json = await req.json().catch(() => null);
    const parsed = customerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: { ...parsed.data, businessId },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
