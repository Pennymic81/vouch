import "server-only";
import { SUPPORTED_CURRENCIES, type Currency } from "./currency";

/** Currency for new projects and rates. Paystack accounts are usually NGN. */
export function appCurrency(): Currency {
  const c = (process.env.APP_CURRENCY ?? "NGN").toUpperCase();
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(c) ? (c as Currency) : "NGN";
}

/** Vouch's share of each milestone, taken from the developer's payout (0–50%). */
export function platformFeePercent() {
  const n = Number(process.env.PLATFORM_FEE_PERCENT ?? 10);
  return Number.isFinite(n) && n >= 0 && n <= 50 ? n : 10;
}

/** The public address of the app — used for Paystack's return link. */
export function appUrl() {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
