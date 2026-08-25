import type { PaymentProvider } from "./types";
import { CardcomProvider } from "./cardcom";
import { PayPalProvider } from "./paypal";

// Single place that decides which gateway implementation is active.
//
// Default is PayPal: opening a PayPal Business account doesn't require an
// Israeli עוסק מורשה/פטור number, unlike Cardcom/Tranzila/Pelecard/Hyp,
// which all require one at signup. Once the business owner registers as
// עוסק, switch PAYMENT_PROVIDER=cardcom (and fill in the CARDCOM_* env
// vars) to move to a locally-optimized Israeli card processor — nothing
// else in the app references either provider directly, both implement the
// same PaymentProvider interface.
function resolveProvider(): PaymentProvider {
  const selected = process.env.PAYMENT_PROVIDER ?? "paypal";
  switch (selected) {
    case "cardcom":
      return new CardcomProvider();
    case "paypal":
    default:
      return new PayPalProvider();
  }
}

export const paymentProvider: PaymentProvider = resolveProvider();
