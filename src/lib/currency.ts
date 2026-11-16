/** Shared money helpers (safe to use on the server and in the browser). */

export const SUPPORTED_CURRENCIES = ["NGN", "USD", "GHS", "KES", "ZAR"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

const LOCALES: Record<string, string> = { NGN: "en-NG", USD: "en-US", GHS: "en-GH", KES: "en-KE", ZAR: "en-ZA" };

export function formatMoney(amount: number, currency = "NGN") {
  return new Intl.NumberFormat(LOCALES[currency] ?? "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Paystack counts money in the smallest unit (kobo, cents…): 100 per whole unit. */
export const toMinor = (amount: number) => Math.round(amount * 100);
export const fromMinor = (minor: number) => Math.round(minor / 100);
