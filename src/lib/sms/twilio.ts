import type { SmsVerifyProvider } from "./types";

/**
 * Twilio Verify integration. Twilio manages code generation, expiry
 * (10 min default) and attempt limits itself — we never see or store the
 * actual code, only forward the phone number and the user's typed code to
 * Twilio's API and trust its verdict.
 */
export class TwilioVerifyProvider implements SmsVerifyProvider {
  readonly name = "twilio";

  private readonly accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
  private readonly authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
  private readonly serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID ?? "";

  private get configured() {
    return Boolean(this.accountSid && this.authToken && this.serviceSid);
  }

  private authHeader() {
    return `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`;
  }

  async sendCode(phoneE164: string): Promise<void> {
    if (!this.configured) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[dev] Twilio not configured — would send SMS code to ${phoneE164}`);
        return;
      }
      throw new Error("SMS verification is not configured (missing TWILIO_* env vars).");
    }

    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${this.serviceSid}/Verifications`,
      {
        method: "POST",
        headers: {
          Authorization: this.authHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phoneE164, Channel: "sms" }),
      }
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Twilio Verify send failed: ${res.status} ${body}`);
    }
  }

  async checkCode(phoneE164: string, code: string): Promise<boolean> {
    if (!this.configured) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[dev] Twilio not configured — accepting any code for ${phoneE164}`);
        return code.length === 6;
      }
      throw new Error("SMS verification is not configured (missing TWILIO_* env vars).");
    }

    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${this.serviceSid}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          Authorization: this.authHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phoneE164, Code: code }),
      }
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { status: string };
    return data.status === "approved";
  }
}
