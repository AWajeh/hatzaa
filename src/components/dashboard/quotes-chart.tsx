"use client";

import { useLocale, useTranslations } from "next-intl";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatMoney } from "@/lib/utils";

interface Point {
  date: string;
  count: number;
  value: number;
}

export function QuotesChart({ data }: { data: Point[] }) {
  const locale = useLocale();
  const t = useTranslations("dashboard.chart");

  const formatted = data.map((p) => ({
    ...p,
    label: new Intl.DateTimeFormat(locale === "en" ? "en-IL" : `${locale}-IL`, { month: "short" }).format(new Date(p.date)),
  }));

  return (
    <div className="h-64 w-full">
      <p className="mb-3 text-sm font-medium text-foreground">{t("title")}</p>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="quotesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(221 70% 52%)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(221 70% 52%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220 14% 90%)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(220 9% 46%)" />
          <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="hsl(220 9% 46%)" width={30} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid hsl(220 14% 90%)", fontSize: 12 }}
            formatter={(value: number, name: string) =>
              name === "value" ? [formatMoney(value, locale, "ILS"), t("revenue")] : [value, t("revenue")]
            }
          />
          <Area type="monotone" dataKey="count" stroke="hsl(221 70% 52%)" fill="url(#quotesFill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
