"use client";

import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { LogOut, User as UserIcon, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/nav/language-switcher";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  userName: string;
  userEmail: string;
  planTier: string;
}

export function Topbar({ userName, userEmail, planTier }: TopbarProps) {
  const t = useTranslations("nav");

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <span className="text-sm font-semibold text-foreground">הצעה</span>
      </div>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-2">
        {planTier === "FREE" && (
          <Link
            href="/settings?tab=billing"
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("upgrade")}
          </Link>
        )}
        <ThemeToggle />
        <LanguageSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70">
              <UserIcon className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{userName}</span>
                <span className="font-normal text-muted-foreground">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">{t("settings")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })} className="text-destructive">
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
