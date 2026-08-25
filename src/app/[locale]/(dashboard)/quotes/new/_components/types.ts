export interface CustomerLite {
  id: string;
  name: string;
  phone: string | null;
}

export interface ServiceLite {
  id: string;
  name: string;
  unit: string;
  price: string;
  category?: { id: string; name: string } | null;
}

export interface BusinessSettings {
  name: string;
  vatRate: string;
  defaultValidityDays: number;
  defaultTerms: string | null;
  currency: string;
}

export interface LineItemDraft {
  key: string;
  serviceId: string | null;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export function createLineItem(partial?: Partial<LineItemDraft>): LineItemDraft {
  return {
    key: Math.random().toString(36).slice(2),
    serviceId: null,
    name: "",
    description: "",
    unit: "יחידה",
    quantity: 1,
    unitPrice: 0,
    ...partial,
  };
}
