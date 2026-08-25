import { LanguageSwitcher } from "@/components/nav/language-switcher";
import { Link } from "@/i18n/routing";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="text-lg font-semibold text-foreground">
          הצעה
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
