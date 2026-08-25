import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { getMonthlyQuoteUsage, getLifetimeQuoteUsage } from "@/lib/subscription";

export async function GET() {
  try {
    const { businessId } = await requireBusiness();

    const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
      include: { plan: true },
    });
    const quotesUsed =
      subscription?.plan.tier === "FREE"
        ? await getLifetimeQuoteUsage(businessId)
        : await getMonthlyQuoteUsage(businessId);

    return NextResponse.json({
      business: {
        ...business,
        vatRate: business.vatRate.toString(),
      },
      subscription,
      quotesUsed,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
