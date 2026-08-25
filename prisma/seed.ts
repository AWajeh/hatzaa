import { PrismaClient, PlanTier, ProfessionType, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Plans -----------------------------------------------------------
  await prisma.plan.upsert({
    where: { tier: PlanTier.FREE },
    update: {},
    create: {
      tier: PlanTier.FREE,
      name: "Free",
      monthlyPriceIls: 0,
      yearlyPriceIls: 0,
      quoteMonthlyLimit: 5,
      features: {
        pdf: true,
        logo: false,
        templates: 1,
        analytics: false,
        team: false,
      },
    },
  });

  await prisma.plan.upsert({
    where: { tier: PlanTier.PRO },
    update: {},
    create: {
      tier: PlanTier.PRO,
      name: "Pro",
      monthlyPriceIls: 79,
      yearlyPriceIls: 790,
      quoteMonthlyLimit: null,
      features: {
        pdf: true,
        logo: true,
        templates: 3,
        analytics: true,
        team: false,
      },
    },
  });

  await prisma.plan.upsert({
    where: { tier: PlanTier.BUSINESS },
    update: {},
    create: {
      tier: PlanTier.BUSINESS,
      name: "Business",
      monthlyPriceIls: 199,
      yearlyPriceIls: 1990,
      quoteMonthlyLimit: null,
      features: {
        pdf: true,
        logo: true,
        templates: "all",
        analytics: true,
        team: true,
        seats: 5,
        advancedBranding: true,
      },
    },
  });

  // --- Demo account (local dev only) ------------------------------------
  const demoEmail = "demo@hatzaa.co.il";
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash("Demo1234!", 10);
    const user = await prisma.user.create({
      data: {
        email: demoEmail,
        name: "דני כהן",
        passwordHash,
        locale: "he",
      },
    });

    const business = await prisma.business.create({
      data: {
        slug: "danny-renovations",
        name: 'דני שיפוצים בע"מ',
        ownerName: "דני כהן",
        profession: ProfessionType.RENOVATION_CONTRACTOR,
        email: demoEmail,
        phone: "050-1234567",
        city: "תל אביב",
        taxId: "123456789",
        vatRate: 0.17,
        members: {
          create: { userId: user.id, role: UserRole.OWNER },
        },
      },
    });

    const freePlan = await prisma.plan.findUniqueOrThrow({ where: { tier: PlanTier.FREE } });
    await prisma.subscription.create({
      data: {
        businessId: business.id,
        planId: freePlan.id,
        status: "TRIALING",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const category = await prisma.serviceCategory.create({
      data: { businessId: business.id, name: "ריצוף וחיפוי", sortOrder: 0 },
    });

    await prisma.service.createMany({
      data: [
        {
          businessId: business.id,
          categoryId: category.id,
          name: "ריצוף קרמיקה",
          description: "התקנת ריצוף קרמיקה כולל דבק ורובה",
          unit: 'מ"ר',
          price: 180,
        },
        {
          businessId: business.id,
          categoryId: category.id,
          name: "חיפוי קיר",
          unit: 'מ"ר',
          price: 150,
        },
        {
          businessId: business.id,
          name: "צביעת קירות",
          unit: 'מ"ר',
          price: 35,
        },
        {
          businessId: business.id,
          name: "החלפת נקודת חשמל",
          unit: "יחידה",
          price: 220,
        },
      ],
    });

    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: "משה לוי",
        phone: "052-9876543",
        email: "moshe@example.com",
        status: "ACTIVE",
      },
    });

    console.log("Seeded demo business:", business.slug, "customer:", customer.name);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
