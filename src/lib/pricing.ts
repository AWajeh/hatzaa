// Money math for quotes. All amounts are handled in agorot (1 ILS = 100 agorot)
// internally to avoid floating point drift, then converted back to shekels.

export type DiscountType = "amount" | "percent";

export interface PricingLineInput {
  quantity: number;
  unitPrice: number;
}

export interface PricingInput {
  items: PricingLineInput[];
  discountType: DiscountType;
  discountValue: number;
  vatRate: number; // e.g. 0.17
}

export interface PricingResult {
  lineTotals: number[];
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  vatTotal: number;
  total: number;
}

const toAgorot = (shekels: number) => Math.round(shekels * 100);
const toShekels = (agorot: number) => Math.round(agorot) / 100;

export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return toShekels(Math.round(toAgorot(unitPrice) * quantity));
}

export function calculateQuotePricing(input: PricingInput): PricingResult {
  const lineTotals = input.items.map((item) =>
    calculateLineTotal(item.quantity, item.unitPrice)
  );

  const subtotalAgorot = lineTotals.reduce((sum, line) => sum + toAgorot(line), 0);

  let discountAgorot = 0;
  if (input.discountType === "percent") {
    const pct = Math.min(Math.max(input.discountValue, 0), 100);
    discountAgorot = Math.round((subtotalAgorot * pct) / 100);
  } else {
    discountAgorot = Math.min(Math.max(toAgorot(input.discountValue), 0), subtotalAgorot);
  }

  const taxableAgorot = Math.max(subtotalAgorot - discountAgorot, 0);
  const vatAgorot = Math.round(taxableAgorot * input.vatRate);
  const totalAgorot = taxableAgorot + vatAgorot;

  return {
    lineTotals,
    subtotal: toShekels(subtotalAgorot),
    discountTotal: toShekels(discountAgorot),
    taxableAmount: toShekels(taxableAgorot),
    vatTotal: toShekels(vatAgorot),
    total: toShekels(totalAgorot),
  };
}

export const DEFAULT_VAT_RATE = Number(process.env.DEFAULT_VAT_RATE ?? "0.17");
