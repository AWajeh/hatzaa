# Israeli payment provider comparison (MVP decision)

Evaluated for: recurring SaaS billing (monthly/yearly), REST API quality,
Hebrew/Israeli business support, webhook reliability, and integration effort.

| | **Cardcom** | **Tranzila** | **Pelecard** | **Hyp (יהלום/Hypay)** |
|---|---|---|---|---|
| API style | Modern REST + JSON, hosted "LowProfile" checkout page | Older REST/form-POST hybrid, iframe or redirect | SOAP-flavored REST, dated docs | REST, newer but smaller ecosystem |
| Recurring billing | Native token + scheduled charge support | Supported via "Tranzila Recurring", separate product | Supported, requires manual token handling | Supported |
| Hosted page (PCI out of our scope) | Yes | Yes | Yes | Yes |
| Webhooks (IPN) | Yes, JSON | Yes, form-encoded | Yes, XML-ish | Yes |
| Hebrew docs / support | Strong, widely used by Israeli SaaS | Strong, very common for e-commerce | Strong, common for enterprise/POS | Good, smaller community |
| Pricing transparency | Clear per-transaction + monthly terminal fee | Clear, similar structure | Requires sales contact | Requires sales contact |
| Integration effort for MVP | Low — one hosted-page create call + one webhook | Low-medium | Medium | Medium |

## Update: PayPal is the active default for launch

The comparison and decision below were written assuming the business owner
already had an Israeli עוסק מורשה/פטור (business registration) number,
which Cardcom (and every other local Israeli gateway — Tranzila, Pelecard,
Hyp) requires as part of merchant account KYC. In practice the owner did
not have one yet at launch time, so **PayPal (`src/lib/payments/paypal.ts`)
is the active provider** (`PAYMENT_PROVIDER=paypal`, the default) —
opening a PayPal Business account does not require that number, so the
business can start collecting real subscription revenue immediately while
the עוסק registration is sorted out separately with רשות המסים.

PayPal is implemented against the exact same `PaymentProvider` interface
as Cardcom, using PayPal's Subscriptions REST API (recurring billing,
hosted checkout so card data never touches our servers, webhook-driven
activation — see `src/app/api/webhooks/paypal/route.ts`). Once the
business has its עוסק number and a Cardcom merchant account, switching
back is `PAYMENT_PROVIDER=cardcom` plus filling in the `CARDCOM_*` env
vars — no other code changes.

## Decision: Cardcom (local-optimized option, once עוסק is registered)

Cardcom is used for the MVP because it has the most modern, JSON-first REST
API of the group, first-class token-based recurring billing (needed for
monthly/yearly SaaS plans), clean webhook payloads, and it's a common choice
for Israeli SaaS products specifically (not just e-commerce/POS like Pelecard
or Hyp tend to skew toward). Tranzila is a strong second choice and was kept
in mind while designing the `PaymentProvider` interface in `types.ts` — the
whole payment layer is written against that interface, not against Cardcom
directly, so switching providers later is a matter of adding a new
`XProvider implements PaymentProvider` class and flipping one line in
`provider.ts`.

## What we never do

- We never receive or store raw card numbers, CVV, or expiry dates. The
  hosted checkout page (iframe/redirect) collects them directly on Cardcom's
  PCI-compliant infrastructure.
- We only persist provider-issued **tokens** and **last 4 digits** for
  display purposes (`Subscription.providerTokenId`, `Payment.last4`).
- Every payment state change (success, failure, refund, cancellation) is
  driven by the provider's **webhook**, not by the browser redirect — a
  closed tab or blocked redirect must never leave billing state incorrect.
