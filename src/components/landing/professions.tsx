"use client";

import { useTranslations } from "next-intl";

const KEYS = [
  "RENOVATION_CONTRACTOR",
  "ELECTRICIAN",
  "PLUMBER",
  "AC_TECHNICIAN",
  "PAINTER",
  "FLOORING",
  "CARPENTER",
  "ALUMINUM",
  "BUILDING_CONTRACTOR",
  "EXCAVATION",
  "INSTALLER",
  "TECHNICIAN",
] as const;

export function Professions() {
  const t = useTranslations("landing.examples");
  const tLanding = useTranslations("landing");
  const tProf = useTranslations("professions");

  return (
    <section id="examples" className="py-16 sm:py-24">
      <div className="container">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{t("title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2.5">
          {KEYS.map((key) => (
            <span
              key={key}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground"
            >
              {tProf(key)}
            </span>
          ))}
        </div>
        <p className="mt-6 text-center text-sm font-medium text-muted-foreground">{tLanding("professionsTitle")}</p>
      </div>
    </section>
  );
}
