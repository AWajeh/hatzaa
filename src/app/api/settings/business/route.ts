import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";
import { businessSettingsSchema } from "@/lib/validations";

export async function PATCH(req: Request) {
  try {
    const { businessId } = await requireBusiness();
    const json = await req.json().catch(() => null);
    const parsed = businessSettingsSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: parsed.data,
    });

    return NextResponse.json({ business: { ...business, vatRate: business.vatRate.toString() } });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
