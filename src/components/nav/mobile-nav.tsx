"use client";

import { useTranslations } from "next-intl";
import { LayoutGrid, Users, ListTree, FileText, Plus } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutGrid },
    { href: "/quotes", label: t("quotes"), icon: FileText },
    { href: "/quotes/new", label: t("newQuote"), icon: Plus, primary: true },
    { href: "/customers", label: t("customers"), icon: Users },
    { href: "/services", label: t("services"), icon: ListTree },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-surface lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/quotes/new" && pathname.startsWith(item.href + "/"));
        if (item.primary) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 items-center justify-center"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
                <item.icon className="h-5 w-5" />
              </span>
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
