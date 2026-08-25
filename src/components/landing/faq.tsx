"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Faq() {
  const t = useTranslations("landing.faq");
  const items = t.raw("items") as Array<{ question: string; answer: string }>;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="container">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{t("title")}</h2>
        </div>

        <div className="mx-auto mt-10 max-w-2xl divide-y divide-border rounded-lg border border-border">
          {items.map((item, idx) => {
            const open = openIndex === idx;
            return (
              <div key={idx}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
                  onClick={() => setOpenIndex(open ? null : idx)}
                >
                  <span className="text-sm font-medium text-foreground">{item.question}</span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                </button>
                {open && <p className="px-5 pb-4 text-sm text-muted-foreground">{item.answer}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
