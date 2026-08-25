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

## Decision: Cardcom

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
