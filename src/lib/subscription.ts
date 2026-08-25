import { prisma } from "@/lib/db";
import { PlanTier } from "@prisma/client";

export async function getBusinessPlan(businessId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId },
    include: { plan: true },
  });

  if (!subscription) {
    // No subscription row yet (shouldn't normally happen post-registration) —
    // treat as Free tier so the app degrades safely instead of crashing.
    const freePlan = await prisma.plan.findUnique({ where: { tier: PlanTier.FREE } });
    return { subscription: null, plan: freePlan };
  }

  return { subscription, plan: subscription.plan };
}

export async function getMonthlyQuoteUsage(businessId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.quote.count({
    where: { businessId, createdAt: { gte: startOfMonth } },
  });
}

// The Free plan's limit is a one-time lifetime allowance, not a monthly
// one — it never resets. Paid plans are unlimited (quoteMonthlyLimit is
// null for them), so this only ever matters for FREE.
export async function getLifetimeQuoteUsage(businessId: string) {
  return prisma.quote.count({ where: { businessId } });
}

export async function assertWithinQuoteQuota(businessId: string) {
  const { plan } = await getBusinessPlan(businessId);
  if (!plan || plan.quoteMonthlyLimit == null) return; // unlimited

  const used =
    plan.tier === "FREE" ? await getLifetimeQuoteUsage(businessId) : await getMonthlyQuoteUsage(businessId);
  if (used >= plan.quoteMonthlyLimit) {
    throw new QuotaExceededError(plan.quoteMonthlyLimit);
  }
}

export class QuotaExceededError extends Error {
  constructor(public limit: number) {
    super(`Monthly quote limit of ${limit} reached`);
    this.name = "QuotaExceededError";
  }
}
