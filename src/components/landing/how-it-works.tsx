"use client";

import { useTranslations } from "next-intl";

export function HowItWorks() {
  const t = useTranslations("landing.howItWorks");
  const steps = t.raw("steps") as Array<{ title: string; description: string }>;

  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="container">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{t("title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {idx + 1}
              </div>
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
