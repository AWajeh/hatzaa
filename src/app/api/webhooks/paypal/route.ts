import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PayPalProvider } from "@/lib/payments/paypal";
import { PlanTier, BillingInterval } from "@prisma/client";

export const runtime = "nodejs";

const paypal = new PayPalProvider();

const PLAN_ID_MAP: Array<{ tier: PlanTier; interval: BillingInterval; envVar: string }> = [
  { tier: PlanTier.PRO, interval: BillingInterval.MONTHLY, envVar: "PAYPAL_PLAN_PRO_MONTHLY" },
  { tier: PlanTier.PRO, interval: BillingInterval.YEARLY, envVar: "PAYPAL_PLAN_PRO_YEARLY" },
  { tier: PlanTier.BUSINESS, interval: BillingInterval.MONTHLY, envVar: "PAYPAL_PLAN_BUSINESS_MONTHLY" },
  { tier: PlanTier.BUSINESS, interval: BillingInterval.YEARLY, envVar: "PAYPAL_PLAN_BUSINESS_YEARLY" },
];

function resolveTierAndInterval(paypalPlanId: string | undefined) {
  if (!paypalPlanId) return null;
  const match = PLAN_ID_MAP.find((m) => process.env[m.envVar] === paypalPlanId);
  return match ? { tier: match.tier, interval: match.interval } : null;
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  const verified = await paypal.verifyWebhookSignatureAsync(rawBody, req.headers);
  if (!verified) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  const event = paypal.parseWebhookEvent(rawBody);
  const raw = event.raw as { resource?: { custom_id?: string; plan_id?: string } };
  const businessId = raw.resource?.custom_id;

  if (event.type === "payment.succeeded" && event.providerSubscriptionId && businessId) {
    const planInfo = resolveTierAndInterval(raw.resource?.plan_id);
    const plan = planInfo
      ? await prisma.plan.findUnique({ where: { tier: planInfo.tier } })
      : null;

    const now = new Date();
    const periodEnd = new Date(now);
    if (planInfo?.interval === "YEARLY") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (plan) {
      await prisma.subscription.upsert({
        where: { businessId },
        update: {
          planId: plan.id,
          status: "ACTIVE",
          billingInterval: planInfo!.interval,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          provider: "paypal",
          providerSubscriptionId: event.providerSubscriptionId,
        },
        create: {
          businessId,
          planId: plan.id,
          status: "ACTIVE",
          billingInterval: planInfo!.interval,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          provider: "paypal",
          providerSubscriptionId: event.providerSubscriptionId,
        },
      });
    }

    if (event.providerPaymentId) {
      await prisma.payment.create({
        data: {
          businessId,
          amount: event.amountIls ?? 0,
          status: "SUCCEEDED",
          provider: "paypal",
          providerPaymentId: event.providerPaymentId,
          rawWebhookPayload: JSON.parse(rawBody),
        },
      });
    }
  } else if (event.type === "subscription.canceled" && event.providerSubscriptionId) {
    await prisma.subscription
      .updateMany({
        where: { providerSubscriptionId: event.providerSubscriptionId },
        data: { status: "CANCELED", canceledAt: new Date() },
      })
      .catch(() => {});
  }

  return NextResponse.json({ received: true });
}
