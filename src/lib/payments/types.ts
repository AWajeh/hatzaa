import type { BillingInterval } from "@prisma/client";

export type NormalizedPaymentStatus = "succeeded" | "failed" | "pending" | "refunded";

export interface ChargeCustomerRef {
  businessId: string;
  email: string;
  name: string;
  phone?: string | null;
}

export interface CreateCheckoutParams {
  business: ChargeCustomerRef;
  planTier: "PRO" | "BUSINESS";
  interval: BillingInterval;
  amountIls: number;
  /** Where the provider should redirect the browser back to after checkout. */
  successUrl: string;
  failureUrl: string;
}

export interface CheckoutSession {
  /** URL to redirect the browser to (hosted payment page / iframe). */
  redirectUrl: string;
  /** Provider-side reference for this checkout attempt, for reconciliation. */
  providerSessionId: string;
}

export interface NormalizedWebhookEvent {
  type: "payment.succeeded" | "payment.failed" | "subscription.canceled" | "subscription.renewed";
  providerPaymentId?: string;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  providerTokenId?: string;
  amountIls?: number;
  status: NormalizedPaymentStatus;
  last4?: string;
  cardBrand?: string;
  failureReason?: string;
  raw: unknown;
}

/**
 * Boundary every Israeli payment gateway integration implements. Card data
 * NEVER passes through our servers or database — the provider's hosted
 * page / iframe collects it and hands us back a token + webhook events.
 * Swapping providers (Cardcom -> Tranzila / Pelecard / Hyp) means writing a
 * new class that implements this interface; nothing else in the app changes.
 */
export interface PaymentProvider {
  readonly name: string;

  /** Starts a hosted checkout for a new or upgraded subscription. */
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSession>;

  /** Cancels recurring billing at the provider. Idempotent. */
  cancelSubscription(providerSubscriptionId: string): Promise<void>;

  /** Verifies an inbound webhook actually came from the provider. */
  verifyWebhookSignature(rawBody: string, headers: Headers): boolean;

  /** Converts a provider-specific webhook payload into our normalized shape. */
  parseWebhookEvent(rawBody: string): NormalizedWebhookEvent;
}
