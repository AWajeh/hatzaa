import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

interface LegalSection {
  title: string;
  body: string;
}

interface LegalDocumentProps {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  backHomeLabel: string;
}

export function LegalDocument({ title, updated, intro, sections, backHomeLabel }: LegalDocumentProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          {backHomeLabel}
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{updated}</p>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{intro}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
