/**
 * One-time setup: creates the PayPal Product + 4 Billing Plans (Pro/Business
 * x Monthly/Yearly) that src/lib/payments/paypal.ts references via
 * PAYPAL_PLAN_* env vars.
 *
 * Usage:
 *   PAYPAL_CLIENT_ID=... PAYPAL_CLIENT_SECRET=... PAYPAL_ENV=sandbox \
 *     npx tsx scripts/setup-paypal-plans.ts
 *
 * Run once per PayPal environment (sandbox, then again for live once
 * ready to accept real money). Copy the printed env vars into .env /
 * Vercel project settings.
 */

const baseUrl =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET before running this script.");
  }
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`OAuth failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function createProduct(accessToken: string): Promise<string> {
  const res = await fetch(`${baseUrl}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Hatzaa Subscription",
      description: "Hatzaa quote management SaaS subscription",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  if (!res.ok) throw new Error(`Create product failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function createPlan(
  accessToken: string,
  productId: string,
  name: string,
  intervalUnit: "MONTH" | "YEAR",
  priceIls: number
): Promise<string> {
  const res = await fetch(`${baseUrl}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      billing_cycles: [
        {
          frequency: { interval_unit: intervalUnit, interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: priceIls.toFixed(2), currency_code: "ILS" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });
  if (!res.ok) throw new Error(`Create plan "${name}" failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function main() {
  console.log(`Using PayPal ${process.env.PAYPAL_ENV === "live" ? "LIVE" : "SANDBOX"} environment`);
  const accessToken = await getAccessToken();
  const productId = await createProduct(accessToken);
  console.log(`Created product: ${productId}`);

  const proMonthly = await createPlan(accessToken, productId, "Pro - Monthly", "MONTH", 79);
  const proYearly = await createPlan(accessToken, productId, "Pro - Yearly", "YEAR", 790);
  const businessMonthly = await createPlan(accessToken, productId, "Business - Monthly", "MONTH", 199);
  const businessYearly = await createPlan(accessToken, productId, "Business - Yearly", "YEAR", 1990);

  console.log("\nAdd these to your environment variables:\n");
  console.log(`PAYPAL_PLAN_PRO_MONTHLY=${proMonthly}`);
  console.log(`PAYPAL_PLAN_PRO_YEARLY=${proYearly}`);
  console.log(`PAYPAL_PLAN_BUSINESS_MONTHLY=${businessMonthly}`);
  console.log(`PAYPAL_PLAN_BUSINESS_YEARLY=${businessYearly}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
