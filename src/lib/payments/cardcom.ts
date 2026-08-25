import crypto from "crypto";
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutSession,
  NormalizedWebhookEvent,
} from "./types";

/**
 * Cardcom "LowProfile" integration.
 *
 * Flow:
 *  1. We call Cardcom's LowProfile/Create REST endpoint with the amount,
 *     success/error redirect URLs, and a webhook (IPN) URL.
 *  2. We redirect the browser to the returned hosted-page URL. Cardcom
 *     collects the card details on their own PCI-compliant page — the
 *     card number never reaches our server.
 *  3. Cardcom charges the card, then (a) redirects the browser back to
 *     successUrl/failureUrl and (b) POSTs a server-to-server webhook to
 *     /api/webhooks/cardcom, which is the source of truth for activating
 *     the subscription (redirects can be skipped/blocked by the browser).
 *  4. For recurring billing we request a token on first charge
 *     (CreateToken=true) and store only the returned token reference
 *     (Subscription.providerTokenId) to charge future renewals via
 *     Cardcom's token-charge endpoint — never raw card data.
 *
 * See ./PROVIDER_COMPARISON.md for why Cardcom was chosen for the MVP.
 */
export class CardcomProvider implements PaymentProvider {
  readonly name = "cardcom";

  private readonly terminalNumber = process.env.CARDCOM_TERMINAL_NUMBER ?? "";
  private readonly apiName = process.env.CARDCOM_API_NAME ?? "";
  private readonly apiPassword = process.env.CARDCOM_API_PASSWORD ?? "";
  private readonly webhookSecret = process.env.CARDCOM_WEBHOOK_SECRET ?? "";
  private readonly baseUrl =
    process.env.CARDCOM_ENV === "production"
      ? "https://secure.cardcom.solutions/api/v11"
      : "https://secure.cardcom.solutions/api/v11"; // Cardcom uses the same host with a test terminal number

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSession> {
    if (!this.terminalNumber || !this.apiName) {
      throw new Error(
        "Cardcom is not configured. Set CARDCOM_TERMINAL_NUMBER / CARDCOM_API_NAME / CARDCOM_API_PASSWORD."
      );
    }

    const body = {
      TerminalNumber: this.terminalNumber,
      ApiName: this.apiName,
      Operation: "ChargeAndCreateToken",
      Amount: params.amountIls,
      SuccessRedirectUrl: params.successUrl,
      FailedRedirectUrl: params.failureUrl,
      WebHookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cardcom`,
      ISOCoinId: 1, // ILS
      Document: {
        Name: params.business.name,
        Email: params.business.email,
      },
      ReturnValue: JSON.stringify({
        businessId: params.business.businessId,
        planTier: params.planTier,
        interval: params.interval,
      }),
    };

    const res = await fetch(`${this.baseUrl}/LowProfile/Create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Cardcom checkout creation failed: ${res.status}`);
    }

    const data = (await res.json()) as { Url: string; LowProfileId: string };

    return {
      redirectUrl: data.Url,
      providerSessionId: data.LowProfileId,
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    // Cardcom recurring billing is managed on our side (we charge the
    // stored token on a schedule via src/lib/payments/billing-cycle.ts),
    // so "canceling" just means we stop scheduling future charges for
    // that token. Nothing to call on Cardcom's side beyond that, but the
    // hook is kept here so a future provider that DOES manage its own
    // subscription objects (e.g. Tranzila Recurring) can call its API.
    void providerSubscriptionId;
  }

  verifyWebhookSignature(rawBody: string, headers: Headers): boolean {
    if (!this.webhookSecret) return process.env.NODE_ENV !== "production";
    const signature = headers.get("x-cardcom-signature") ?? "";
    const expected = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  parseWebhookEvent(rawBody: string): NormalizedWebhookEvent {
    const payload = JSON.parse(rawBody) as {
      ResponseCode: number;
      LowProfileId: string;
      TranzactionId?: string;
      TokenInfo?: { Token: string };
      UIValues?: { CardOwnerEmail?: string };
      Amount?: number;
      Last4CardDigits?: string;
      CardBrand?: string;
      Description?: string;
    };

    const succeeded = payload.ResponseCode === 0;

    return {
      type: succeeded ? "payment.succeeded" : "payment.failed",
      providerPaymentId: payload.TranzactionId ?? payload.LowProfileId,
      providerTokenId: payload.TokenInfo?.Token,
      amountIls: payload.Amount,
      status: succeeded ? "succeeded" : "failed",
      last4: payload.Last4CardDigits,
      cardBrand: payload.CardBrand,
      failureReason: succeeded ? undefined : payload.Description,
      raw: payload,
    };
  }
}
