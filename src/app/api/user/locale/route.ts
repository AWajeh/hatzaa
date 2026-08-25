import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";
import { z } from "zod";

const schema = z.object({ locale: z.enum(["he", "ar", "en"]) });

export async function PATCH(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { locale: parsed.data.locale },
  });

  return NextResponse.json({ ok: true });
}
