import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireBusiness, UnauthorizedError } from "@/lib/tenant";

// MVP logo storage: the browser reads the file as a data URL and we persist
// it directly on Business.logoUrl. Fine for small PNG/JPG logos; swap for
// S3/Cloudinary + a real URL once file sizes/volume justify it.
const MAX_BYTES = 400 * 1024;
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

const schema = z.object({ dataUrl: z.string().startsWith("data:image/") });

export async function POST(req: Request) {
  try {
    const { businessId } = await requireBusiness();
    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });

    const match = parsed.data.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return NextResponse.json({ error: "INVALID" }, { status: 400 });

    const [, mime, base64] = match;
    if (!ALLOWED_MIME.includes(mime!)) {
      return NextResponse.json({ error: "UNSUPPORTED_TYPE" }, { status: 400 });
    }
    const approxBytes = (base64!.length * 3) / 4;
    if (approxBytes > MAX_BYTES) {
      return NextResponse.json({ error: "TOO_LARGE" }, { status: 400 });
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: { logoUrl: parsed.data.dataUrl },
    });

    return NextResponse.json({ logoUrl: business.logoUrl });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}

export async function DELETE() {
  try {
    const { businessId } = await requireBusiness();
    await prisma.business.update({ where: { id: businessId }, data: { logoUrl: null } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    throw err;
  }
}
