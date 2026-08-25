// WhatsApp deep-link integration (MVP). No WhatsApp Business API dependency —
// this opens wa.me with a prefilled message, which works for any customer
// phone number without needing an approved business account. The
// `WhatsAppProvider` boundary below is what a future WhatsApp Business API
// (Cloud API) integration would implement instead, without touching callers.

export interface WhatsAppMessageParams {
  customerName: string;
  businessName: string;
  link: string;
}

export interface WhatsAppProvider {
  buildSendUrl(phone: string | null | undefined, message: string): string;
}

function normalizeIsraeliPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
}

class DeepLinkWhatsAppProvider implements WhatsAppProvider {
  buildSendUrl(phone: string | null | undefined, message: string): string {
    const encoded = encodeURIComponent(message);
    if (phone) {
      return `https://wa.me/${normalizeIsraeliPhone(phone)}?text=${encoded}`;
    }
    return `https://wa.me/?text=${encoded}`;
  }
}

export const whatsAppProvider: WhatsAppProvider = new DeepLinkWhatsAppProvider();

export function buildWhatsAppMessage(
  template: string,
  params: WhatsAppMessageParams
): string {
  return template
    .replace("{customerName}", params.customerName)
    .replace("{businessName}", params.businessName)
    .replace("{link}", params.link);
}
