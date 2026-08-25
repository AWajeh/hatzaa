import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { paymentProvider } from "@/lib/payments/provider";
import { rateLimit } from "@/lib/rate-limit";
import { PlanTier, BillingInterval } from "@prisma/client";

const schema = z.object({
  planTier: z.enum(["PRO", "BUSINESS"]),
  interval: z.enum(["MONTHLY", "YEARLY"]),
});

export async function POST(req: Request) {
  try {
    const { businessId, session } = await requireBusiness();

    const { allowed } = rateLimit(`billing-checkout:${businessId}`, 10, 60_000);
    if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });

    const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
    const plan = await prisma.plan.findUniqueOrThrow({
      where: { tier: parsed.data.planTier as PlanTier },
    });
    const amount =
      parsed.data.interval === "YEARLY" ? Number(plan.yearlyPriceIls) : Number(plan.monthlyPriceIls);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const checkout = await paymentProvider.createCheckoutSession({
      business: {
        businessId,
        email: business.email ?? session.user.email,
        name: business.name,
        phone: business.phone,
      },
      planTier: parsed.data.planTier,
      interval: parsed.data.interval as BillingInterval,
      amountIls: amount,
      successUrl: `${appUrl}/settings?billing=success`,
      failureUrl: `${appUrl}/settings?billing=failed`,
    });

    return NextResponse.json(checkout);
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (err instanceof Error && err.message.includes("not configured")) {
      return NextResponse.json({ error: "PAYMENTS_NOT_CONFIGURED" }, { status: 503 });
    }
    throw err;
  }
}
