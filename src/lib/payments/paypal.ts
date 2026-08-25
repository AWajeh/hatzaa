import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutSession,
  NormalizedWebhookEvent,
} from "./types";

/**
 * PayPal Subscriptions integration.
 *
 * Chosen as the default provider for the MVP instead of Cardcom because
 * opening a PayPal Business account does not require an Israeli business
 * registration number (עוסק מורשה/פטור) up front, unlike every local
 * Israeli gateway (Cardcom, Tranzila, Pelecard, Hyp) which all require one
 * as part of merchant KYC. This lets the business start collecting real
 * subscription revenue immediately; once the owner registers as עוסק,
 * switching back to Cardcom is a one-line change in provider.ts since both
 * classes implement the same `PaymentProvider` interface.
 *
 * Flow:
 *  1. A PayPal "Product" and four "Plans" (Pro/Business x Monthly/Yearly)
 *     must exist once in the PayPal account — see
 *     `scripts/setup-paypal-plans.ts`, which creates them via the REST API
 *     and prints the plan IDs to put in PAYPAL_PLAN_* env vars.
 *  2. createCheckoutSession() creates a Subscription against the right
 *     plan ID and returns PayPal's hosted "approve" link — the browser is
 *     redirected there, PayPal collects the card, never touching our
 *     servers (PCI stays entirely on PayPal's side).
 *  3. PayPal POSTs webhook events (BILLING.SUBSCRIPTION.ACTIVATED,
 *     PAYMENT.SALE.COMPLETED, BILLING.SUBSCRIPTION.CANCELLED, ...) to
 *     /api/webhooks/paypal, which is the source of truth for activating a
 *     subscription — never the browser return redirect alone.
 */
export class PayPalProvider implements PaymentProvider {
  readonly name = "paypal";

  private readonly clientId = process.env.PAYPAL_CLIENT_ID ?? "";
  private readonly clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  private readonly webhookId = process.env.PAYPAL_WEBHOOK_ID ?? "";
  private readonly baseUrl =
    process.env.PAYPAL_ENV === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  private planIdFor(planTier: "PRO" | "BUSINESS", interval: "MONTHLY" | "YEARLY"): string {
    const key = `PAYPAL_PLAN_${planTier}_${interval}`;
    const id = process.env[key];
    if (!id) {
      throw new Error(
        `PayPal is not configured: missing ${key}. Run scripts/setup-paypal-plans.ts once and set the printed plan IDs as env vars.`
      );
    }
    return id;
  }

  private async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        "PayPal is not configured. Set PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET."
      );
    }
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) throw new Error(`PayPal OAuth failed: ${res.status}`);
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSession> {
    const accessToken = await this.getAccessToken();
    const planId = this.planIdFor(params.planTier, params.interval);

    const res = await fetch(`${this.baseUrl}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `${params.business.businessId}-${Date.now()}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: {
          name: { given_name: params.business.name.split(" ")[0] ?? params.business.name },
          email_address: params.business.email,
        },
        custom_id: params.business.businessId,
        application_context: {
          brand_name: "Hatzaa",
          locale: "he-IL",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: params.successUrl,
          cancel_url: params.failureUrl,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`PayPal checkout creation failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as {
      id: string;
      links: Array<{ rel: string; href: string }>;
    };
    const approveLink = data.links.find((l) => l.rel === "approve");
    if (!approveLink) throw new Error("PayPal did not return an approval link");

    return {
      redirectUrl: approveLink.href,
      providerSessionId: data.id,
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    const accessToken = await this.getAccessToken();
    await fetch(`${this.baseUrl}/v1/billing/subscriptions/${providerSubscriptionId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: "Canceled by customer from Hatzaa settings" }),
    });
  }

  verifyWebhookSignature(rawBody: string, headers: Headers): boolean {
    // PayPal signature verification is itself an API call (it can't be
    // done locally with just a shared secret like HMAC providers), so the
    // actual verification happens asynchronously in the webhook route via
    // `verifyWebhookSignatureAsync`. This synchronous method exists to
    // satisfy the shared PaymentProvider interface; treat it as a
    // structural pre-check only.
    void rawBody;
    return Boolean(this.webhookId) || process.env.NODE_ENV !== "production";
  }

  async verifyWebhookSignatureAsync(rawBody: string, headers: Headers): Promise<boolean> {
    if (!this.webhookId) return process.env.NODE_ENV !== "production";

    const accessToken = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: this.webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { verification_status: string };
    return data.verification_status === "SUCCESS";
  }

  parseWebhookEvent(rawBody: string): NormalizedWebhookEvent {
    const event = JSON.parse(rawBody) as {
      event_type: string;
      resource: {
        id?: string;
        billing_agreement_id?: string;
        custom_id?: string;
        amount?: { total?: string; value?: string };
        status?: string;
      };
    };

    const resource = event.resource;

    switch (event.event_type) {
      case "PAYMENT.SALE.COMPLETED":
        return {
          type: "payment.succeeded",
          providerPaymentId: resource.id,
          providerSubscriptionId: resource.billing_agreement_id,
          providerCustomerId: resource.custom_id,
          amountIls: resource.amount ? Number(resource.amount.total ?? resource.amount.value) : undefined,
          status: "succeeded",
          raw: event,
        };
      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUSED":
        return {
          type: "payment.failed",
          providerPaymentId: resource.id,
          providerSubscriptionId: resource.billing_agreement_id,
          status: "failed",
          failureReason: event.event_type,
          raw: event,
        };
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        return {
          type: "payment.succeeded",
          providerSubscriptionId: resource.id,
          providerCustomerId: resource.custom_id,
          status: "succeeded",
          raw: event,
        };
      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
        return {
          type: "subscription.canceled",
          providerSubscriptionId: resource.id,
          status: "succeeded",
          raw: event,
        };
      default:
        return {
          type: "payment.failed",
          status: "pending",
          raw: event,
        };
    }
  }
}
