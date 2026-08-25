import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";

export async function GET() {
  try {
    const { businessId } = await requireBusiness();

    const business = await prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: {
        name: true,
        vatRate: true,
        defaultValidityDays: true,
        defaultTerms: true,
        currency: true,
      },
    });

    return NextResponse.json({ business });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
