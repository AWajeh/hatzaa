import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { paymentProvider } from "@/lib/payments/provider";
import { PlanTier, BillingInterval } from "@prisma/client";

export const runtime = "nodejs";

interface CardcomReturnValue {
  businessId: string;
  planTier: "PRO" | "BUSINESS";
  interval: "MONTHLY" | "YEARLY";
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!paymentProvider.verifyWebhookSignature(rawBody, req.headers)) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  const event = paymentProvider.parseWebhookEvent(rawBody);

  let returnValue: CardcomReturnValue | null = null;
  try {
    const raw = JSON.parse(rawBody) as { ReturnValue?: string };
    if (raw.ReturnValue) returnValue = JSON.parse(raw.ReturnValue) as CardcomReturnValue;
  } catch {
    // Some webhook events (e.g. later renewals) may not carry ReturnValue;
    // those are matched via providerSubscriptionId instead, below.
  }

  if (event.type === "payment.succeeded" && returnValue) {
    const plan = await prisma.plan.findUnique({ where: { tier: returnValue.planTier as PlanTier } });
    if (!plan) return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 400 });

    const now = new Date();
    const periodEnd = new Date(now);
    if (returnValue.interval === "YEARLY") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await prisma.subscription.upsert({
      where: { businessId: returnValue.businessId },
      update: {
        planId: plan.id,
        status: "ACTIVE",
        billingInterval: returnValue.interval as BillingInterval,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        provider: "cardcom",
        providerTokenId: event.providerTokenId,
      },
      create: {
        businessId: returnValue.businessId,
        planId: plan.id,
        status: "ACTIVE",
        billingInterval: returnValue.interval as BillingInterval,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        provider: "cardcom",
        providerTokenId: event.providerTokenId,
      },
    });

    await prisma.payment.create({
      data: {
        businessId: returnValue.businessId,
        subscriptionId: subscription.id,
        amount: event.amountIls ?? 0,
        status: "SUCCEEDED",
        provider: "cardcom",
        providerPaymentId: event.providerPaymentId,
        last4: event.last4,
        cardBrand: event.cardBrand,
        rawWebhookPayload: JSON.parse(rawBody),
      },
    });
  } else if (event.type === "payment.failed" && returnValue) {
    await prisma.payment.create({
      data: {
        businessId: returnValue.businessId,
        amount: event.amountIls ?? 0,
        status: "FAILED",
        provider: "cardcom",
        providerPaymentId: event.providerPaymentId,
        failureReason: event.failureReason,
        rawWebhookPayload: JSON.parse(rawBody),
      },
    });
  }

  return NextResponse.json({ received: true });
}
