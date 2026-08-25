"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => { render: (selector: string) => void };
    };
  }
}

interface PayPalButtonsProps {
  planTier: "PRO" | "BUSINESS";
  interval: "MONTHLY" | "YEARLY";
  onActivated: () => void;
}

let sdkLoadPromise: Promise<void> | null = null;

function loadPayPalSdk(clientId: string): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    // components=buttons renders PayPal + guest Debit/Credit Card automatically;
    // Google Pay / Apple Pay are added and only appear when the visitor's
    // browser/device and the merchant account are eligible for them.
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&vault=true&intent=subscription&currency=ILS&components=buttons,googlepay,applepay&locale=he_IL`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.body.appendChild(script);
  });
  return sdkLoadPromise;
}

export function PayPalButtons({ planTier, interval, onActivated }: PayPalButtonsProps) {
  const t = useTranslations("settings.billing");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError("PayPal is not configured yet.");
      return;
    }

    let cancelled = false;

    loadPayPalSdk(clientId)
      .then(() => {
        if (cancelled || !window.paypal || !containerRef.current) return;
        containerRef.current.innerHTML = "";

        window.paypal
          .Buttons({
            style: { layout: "vertical", shape: "pill", label: "subscribe" },
            createSubscription: async () => {
              const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planTier, interval }),
              });
              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? "Checkout failed");
              }
              const body = (await res.json()) as { providerSessionId: string };
              return body.providerSessionId;
            },
            onApprove: () => {
              toast.success(t("subscriptionActivating"));
              onActivated();
            },
            onError: () => {
              toast.error(t("subscriptionError"));
            },
          })
          .render(`#paypal-buttons-${planTier}-${interval}`);
      })
      .catch(() => setError("Failed to load PayPal."));

    return () => {
      cancelled = true;
    };
  }, [planTier, interval, onActivated, t]);

  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>;
  }

  return <div id={`paypal-buttons-${planTier}-${interval}`} ref={containerRef} className="min-h-11" />;
}
