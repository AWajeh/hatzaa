import type { SmsVerifyProvider } from "./types";
import { TwilioVerifyProvider } from "./twilio";

export const smsProvider: SmsVerifyProvider = new TwilioVerifyProvider();

/** Normalizes an Israeli local number (05X-XXXXXXX / 05XXXXXXXX) to E.164 (+972...). */
export function toE164Israel(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("972")) return `+${digits}`;
  if (digits.startsWith("0")) return `+972${digits.slice(1)}`;
  if (phone.startsWith("+")) return phone;
  return `+${digits}`;
}
