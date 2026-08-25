import { prisma } from "@/lib/db";

export async function getDashboardStats(businessId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [totalQuotesEver, monthQuotes, recentQuotes, seriesQuotes] = await Promise.all([
    prisma.quote.count({ where: { businessId } }),
    prisma.quote.findMany({
      where: { businessId, createdAt: { gte: startOfMonth } },
      select: { status: true, total: true },
    }),
    prisma.quote.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.quote.findMany({
      where: { businessId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true, total: true },
    }),
  ]);

  const sent = monthQuotes.filter((q) => q.status !== "DRAFT").length;
  const viewed = monthQuotes.filter((q) => ["VIEWED", "ACCEPTED", "REJECTED"].includes(q.status)).length;
  const accepted = monthQuotes.filter((q) => q.status === "ACCEPTED").length;
  const rejected = monthQuotes.filter((q) => q.status === "REJECTED").length;
  const totalValue = monthQuotes
    .filter((q) => q.status === "ACCEPTED")
    .reduce((sum, q) => sum + Number(q.total), 0);
  const responded = accepted + rejected;
  const acceptanceRate = responded > 0 ? accepted / responded : 0;

  const monthBuckets = new Map<string, { count: number; value: number }>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    monthBuckets.set(`${d.getFullYear()}-${d.getMonth()}`, { count: 0, value: 0 });
  }
  for (const q of seriesQuotes) {
    const key = `${q.createdAt.getFullYear()}-${q.createdAt.getMonth()}`;
    const bucket = monthBuckets.get(key);
    if (bucket) {
      bucket.count += 1;
      if (q.status === "ACCEPTED") bucket.value += Number(q.total);
    }
  }

  return {
    totalQuotesEver,
    quotesThisMonth: monthQuotes.length,
    sent,
    viewed,
    accepted,
    rejected,
    totalValue,
    acceptanceRate,
    recentQuotes: recentQuotes.map((q) => ({
      id: q.id,
      number: q.number,
      status: q.status,
      total: Number(q.total),
      customerName: q.customer.name,
      createdAt: q.createdAt.toISOString(),
    })),
    series: Array.from(monthBuckets.entries()).map(([key, v]) => {
      const [year, month] = key.split("-").map(Number);
      return { date: new Date(year!, month!, 1).toISOString(), ...v };
    }),
  };
}
