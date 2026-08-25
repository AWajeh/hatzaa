import type { PaymentProvider } from "./types";
import { CardcomProvider } from "./cardcom";

// Single place that decides which gateway implementation is active. To
// switch providers (e.g. move to Tranzila), implement PaymentProvider in a
// new file and change this one line — nothing else in the app references
// Cardcom directly.
export const paymentProvider: PaymentProvider = new CardcomProvider();
