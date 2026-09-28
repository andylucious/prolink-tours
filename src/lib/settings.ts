import "server-only";
import { cache } from "react";
import { db } from "./db";

export const DEFAULT_SETTINGS = {
  companyName: "ProLink Tours",
  logo: "",
  tagline: "Unforgettable safaris, beaches & sports trips across East Africa",
  email: "info@example.com",
  phone: "+254 700 000 000",
  whatsapp: "254700000000",
  address: "Nairobi, Kenya",
  aboutText:
    "We are a Kenyan-owned tour company with years of experience crafting wildlife safaris, beach holidays and sports tourism packages. Our team handles every detail — from park fees to airport transfers — so you can enjoy the journey.",
  usdToKes: "129",
  invoiceTerms: "50% deposit confirms the booking. Balance due 30 days before travel.",
  bankDetails: "Bank: Example Bank Kenya\nAccount name: ProLink Tours Ltd\nAccount no: 0000000000",
  mpesaDetails: "Paybill: 000000\nAccount: Your booking reference",
  notifyEmail: "",
  facebook: "",
  instagram: "",
};

export type Settings = typeof DEFAULT_SETTINGS;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.setting.findMany();
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in out) (out as Record<string, string>)[r.key] = r.value;
  return out;
});
