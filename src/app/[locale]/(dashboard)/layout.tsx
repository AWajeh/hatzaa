import { redirect } from "next/navigation";

// Every page in this segment reads the signed-in user's session and
// tenant-scoped data — never statically prerender it (would bake one
// user's data into a shared build artifact).
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/nav/sidebar";
import { Topbar } from "@/components/nav/topbar";
import { MobileNav } from "@/components/nav/mobile-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!session.user.businessId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phoneVerifiedAt: true },
  });
  if (!user?.phoneVerifiedAt) redirect("/verify");

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
    select: { name: true, logoUrl: true },
  });
  if (!business) redirect("/login");

  const subscription = await prisma.subscription.findUnique({
    where: { businessId: session.user.businessId },
    include: { plan: true },
  });
  const planTier = subscription?.plan.tier ?? "FREE";

  return (
    <div className="flex min-h-dvh">
      <Sidebar businessName={business.name} logoUrl={business.logoUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userName={session.user.name ?? ""} userEmail={session.user.email ?? ""} planTier={planTier} />
        <main className="flex-1 overflow-x-hidden bg-muted/30 p-4 pb-24 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
