"use client";

import { useTranslations } from "next-intl";
import { Zap, Smartphone, FileText, Eye, MessageCircle, Calculator } from "lucide-react";

const ICONS = [Zap, Smartphone, FileText, Eye, MessageCircle, Calculator];

export function Features() {
  const t = useTranslations("landing.features");
  const items = t.raw("items") as Array<{ title: string; description: string }>;

  return (
    <section id="features" className="border-t border-border bg-surface py-16 sm:py-24">
      <div className="container">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{t("title")}</h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => {
            const Icon = ICONS[idx % ICONS.length]!;
            return (
              <div key={idx} className="rounded-lg border border-border bg-background p-6">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
