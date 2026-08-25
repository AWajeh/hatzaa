import type { EmailProvider, SendEmailParams } from "./types";

/**
 * Resend integration (plain REST call, no SDK dependency needed for
 * something this small). Used for email verification codes and password
 * reset links. In development without RESEND_API_KEY set, emails are
 * logged to the console instead of failing the request.
 */
export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  private readonly apiKey = process.env.RESEND_API_KEY ?? "";
  private readonly from = process.env.RESEND_FROM_EMAIL ?? "Hatzaa <onboarding@resend.dev>";

  async send({ to, subject, html }: SendEmailParams): Promise<void> {
    if (!this.apiKey) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[dev] Resend not configured — would email "${subject}" to ${to}:\n${html}`);
        return;
      }
      throw new Error("Email sending is not configured (missing RESEND_API_KEY).");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: this.from, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend send failed: ${res.status} ${body}`);
    }
  }
}
