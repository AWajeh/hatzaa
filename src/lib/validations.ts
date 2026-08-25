import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  businessName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(9).max(20),
  password: z.string().min(8).max(100),
  locale: z.enum(["he", "ar", "en"]).default("he"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const otpCodeSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d+$/),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const customerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).default("LEAD"),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const serviceSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(2000).optional().or(z.literal("")),
  unit: z.string().min(1).max(30),
  price: z.coerce.number().min(0),
  categoryId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().or(z.literal("")),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const serviceCategorySchema = z.object({
  name: z.string().min(1).max(100),
});

export const quoteItemSchema = z.object({
  serviceId: z.string().optional().nullable(),
  name: z.string().min(1).max(150),
  description: z.string().max(2000).optional().or(z.literal("")),
  unit: z.string().min(1).max(30),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
});

export const quoteSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().max(150).optional().or(z.literal("")),
  items: z.array(quoteItemSchema).min(1),
  discountType: z.enum(["amount", "percent"]).default("amount"),
  discountValue: z.coerce.number().min(0).default(0),
  vatRate: z.coerce.number().min(0).max(1),
  validUntil: z.string().optional().nullable(),
  terms: z.string().max(2000).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "SENT"]).default("DRAFT"),
});
export type QuoteInput = z.infer<typeof quoteSchema>;

export const businessSettingsSchema = z.object({
  name: z.string().min(2).max(150),
  ownerName: z.string().max(150).optional().or(z.literal("")),
  profession: z.enum([
    "RENOVATION_CONTRACTOR",
    "ELECTRICIAN",
    "PLUMBER",
    "AC_TECHNICIAN",
    "PAINTER",
    "FLOORING",
    "CARPENTER",
    "ALUMINUM",
    "BUILDING_CONTRACTOR",
    "EXCAVATION",
    "INSTALLER",
    "TECHNICIAN",
    "OTHER",
  ]),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  taxId: z.string().max(30).optional().or(z.literal("")),
});

export const preferencesSchema = z.object({
  locale: z.enum(["he", "ar", "en"]),
  vatRate: z.coerce.number().min(0).max(1),
  quotePrefix: z.string().min(1).max(10),
  defaultValidityDays: z.coerce.number().int().min(1).max(365),
  defaultTerms: z.string().max(2000).optional().or(z.literal("")),
});

export const publicQuoteRespondSchema = z.object({
  action: z.enum(["accept", "reject"]),
  note: z.string().max(1000).optional().or(z.literal("")),
});
