"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import { locales, localeLabels, type AppLocale } from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { status } = useSession();

  function switchTo(next: AppLocale) {
    if (status === "authenticated") {
      fetch("/api/user/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      }).catch(() => {});
    }
    router.replace(
      // @ts-expect-error dynamic route params from next-intl navigation
      { pathname, params },
      { locale: next }
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Globe className="h-4 w-4" />
          {localeLabels[locale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => switchTo(l)}>
            {localeLabels[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
