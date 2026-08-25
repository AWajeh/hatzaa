import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Resolves the signed-in user's session and their active business, enforcing
 * tenant isolation: every server action / API route that touches
 * business-scoped data must call this first and use the returned
 * businessId in every Prisma where clause.
 */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session;
}

export async function requireBusiness() {
  const session = await requireSession();
  if (!session.user.businessId) {
    throw new UnauthorizedError("No business associated with this account");
  }
  return {
    session,
    businessId: session.user.businessId,
    role: session.user.role,
  };
}

export async function getBusinessSettings(businessId: string) {
  return prisma.business.findUniqueOrThrow({ where: { id: businessId } });
}
