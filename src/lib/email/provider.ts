import type { EmailProvider } from "./types";
import { ResendEmailProvider } from "./resend";

export const emailProvider: EmailProvider = new ResendEmailProvider();
