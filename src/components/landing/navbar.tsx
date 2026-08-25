"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button, buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/nav/language-switcher";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { cn } from "@/lib/utils";

export function Navbar() {
  const t = useTranslations("landing.nav");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#how-it-works", label: t("howItWorks") },
    { href: "#features", label: t("features") },
    { href: "#pricing", label: t("pricing") },
    { href: "#faq", label: t("faq") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-foreground">
          הצעה
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            {t("login")}
          </Link>
          <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
            {t("signup")}
          </Link>
        </div>

        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="border-t border-border px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm font-medium text-foreground">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
              {t("login")}
            </Link>
            <Link href="/register" className={cn(buttonVariants())}>
              {t("signup")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
