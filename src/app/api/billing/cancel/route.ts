import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { paymentProvider } from "@/lib/payments/provider";

export async function POST() {
  try {
    const { businessId } = await requireBusiness();

    const subscription = await prisma.subscription.findUnique({ where: { businessId } });
    if (!subscription) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    if (subscription.providerSubscriptionId) {
      await paymentProvider.cancelSubscription(subscription.providerSubscriptionId);
    }

    const updated = await prisma.subscription.update({
      where: { businessId },
      data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
    });

    return NextResponse.json({ subscription: updated });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
