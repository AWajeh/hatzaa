"use client";

import { useTranslations } from "next-intl";
import { LayoutGrid, Users, ListTree, FileText, Settings, Plus } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface SidebarProps {
  businessName: string;
  logoUrl?: string | null;
}

export function Sidebar({ businessName, logoUrl }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutGrid },
    { href: "/quotes", label: t("quotes"), icon: FileText },
    { href: "/customers", label: t("customers"), icon: Users },
    { href: "/services", label: t("services"), icon: ListTree },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-e border-border bg-surface lg:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={businessName} className="h-7 w-7 rounded-md object-cover" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            {businessName.charAt(0)}
          </div>
        )}
        <span className="truncate text-sm font-semibold text-foreground">{businessName}</span>
      </div>

      <div className="p-3">
        <Link
          href="/quotes/new"
          className={cn(buttonVariants({ size: "sm" }), "w-full justify-center")}
        >
          <Plus className="h-4 w-4" />
          {t("newQuote")}
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
