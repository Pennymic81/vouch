import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { appUrl } from "./settings";

/**
 * Small Paystack client (https://paystack.com/docs/api).
 * - Real mode: PAYSTACK_SECRET_KEY=sk_test_… or sk_live_…
 * - Test mode: PAYSTACK_FAKE=1 — an in-process stand-in with a pretend checkout page,
 *   so automated tests never touch the real API or real money.
 * - Neither set: payments are simulated by the app (no Paystack at all).
 */

const API = "https://api.paystack.co";

export class PaystackError extends Error {}

const fake = () => process.env.PAYSTACK_FAKE === "1";
const secret = () => process.env.PAYSTACK_SECRET_KEY ?? "";

export function paymentsEnabled() {
  return fake() || secret().startsWith("sk_");
}

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !json?.status) {
    console.error(`[paystack] ${init?.method ?? "GET"} ${path} failed`, res.status, json?.message);
    throw new PaystackError(json?.message || "Paystack didn't accept the request.");
  }
  return json.data as T;
}

// ── Collecting payments ───────────────────────────────────────────

export async function initializeTransaction(input: {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}): Promise<{ authorizationUrl: string }> {
  if (fake()) {
    fakeStore().charges.set(input.reference, { status: "pending", amountMinor: input.amountMinor, currency: input.currency });
    const url = new URL("/payments/fake-checkout", appUrl());
    url.searchParams.set("reference", input.reference);
    url.searchParams.set("callback", input.callbackUrl);
    return { authorizationUrl: url.toString() };
  }
  const data = await call<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: {
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    },
  });
  return { authorizationUrl: data.authorization_url };
}

export type VerifiedTransaction = { status: string; amountMinor: number; currency: string; channel: string | null };

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  if (fake()) {
    const c = fakeStore().charges.get(reference);
    if (!c) throw new PaystackError("Transaction reference not found");
    return { status: c.status, amountMinor: c.amountMinor, currency: c.currency, channel: c.status === "success" ? "card" : null };
  }
  const d = await call<{ status: string; amount: number; currency: string; channel: string | null }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return { status: d.status, amountMinor: d.amount, currency: d.currency, channel: d.channel };
}

// ── Paying developers ─────────────────────────────────────────────

export type Bank = { name: string; code: string };

const FAKE_BANKS: Bank[] = [
  { name: "Access Bank", code: "044" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "United Bank For Africa", code: "033" },
  { name: "Zenith Bank", code: "057" },
];

export async function listBanks(currency: string): Promise<Bank[]> {
  if (fake()) return FAKE_BANKS;
  const banks = await call<{ name: string; code: string; active: boolean }[]>(`/bank?currency=${encodeURIComponent(currency)}&perPage=100`);
  return banks.filter((b) => b.active !== false).map((b) => ({ name: b.name, code: b.code }));
}

/** Asks the bank for the account holder's name, so developers can confirm it's theirs. */
export async function resolveAccount(accountNumber: string, bankCode: string): Promise<{ accountName: string }> {
  if (fake()) {
    if (accountNumber.startsWith("000")) throw new PaystackError("Could not resolve account name. Check parameters or try again.");
    return { accountName: "TEST ACCOUNT HOLDER" };
  }
  const d = await call<{ account_name: string }>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  );
  return { accountName: d.account_name };
}

export async function createRecipient(input: { name: string; accountNumber: string; bankCode: string; currency: string }) {
  if (fake()) {
    // Account numbers ending in 9999 are set up to fail transfers, for testing.
    return { recipientCode: `RCP_fake_${input.accountNumber.endsWith("9999") ? "fail" : "ok"}_${input.accountNumber.slice(-4)}` };
  }
  const d = await call<{ recipient_code: string }>("/transferrecipient", {
    method: "POST",
    body: { type: "nuban", name: input.name, account_number: input.accountNumber, bank_code: input.bankCode, currency: input.currency },
  });
  return { recipientCode: d.recipient_code };
}

export type TransferResult = { status: "success" | "pending" | "failed" | "otp" | "reversed" | string; transferCode: string | null; reason?: string };

export async function initiateTransfer(input: {
  amountMinor: number;
  currency: string;
  recipientCode: string;
  reference: string;
  reason: string;
}): Promise<TransferResult> {
  if (fake()) {
    const failing = input.recipientCode.includes("_fail_");
    const result = { status: failing ? "failed" : "success", transferCode: `TRF_fake_${input.reference.slice(0, 8)}`, reason: failing ? "Account could not be credited" : undefined };
    fakeStore().transfers.set(input.reference, result);
    return result;
  }
  const d = await call<{ status: string; transfer_code: string }>("/transfer", {
    method: "POST",
    body: {
      source: "balance",
      amount: input.amountMinor,
      currency: input.currency,
      recipient: input.recipientCode,
      reference: input.reference,
      reason: input.reason,
    },
  });
  return { status: d.status, transferCode: d.transfer_code };
}

export async function verifyTransfer(reference: string): Promise<TransferResult> {
  if (fake()) return fakeStore().transfers.get(reference) ?? { status: "pending", transferCode: null };
  const d = await call<{ status: string; transfer_code: string; reason?: string }>(`/transfer/verify/${encodeURIComponent(reference)}`);
  return { status: d.status, transferCode: d.transfer_code, reason: d.reason };
}

// ── Webhooks ──────────────────────────────────────────────────────

/** Paystack signs each webhook: hex HMAC-SHA512 of the raw body, keyed with the secret key. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const key = secret();
  if (!key || !signature) return false;
  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// ── Test double state ─────────────────────────────────────────────

type FakeStore = {
  charges: Map<string, { status: string; amountMinor: number; currency: string }>;
  transfers: Map<string, TransferResult>;
};

/** Shared across the whole server process (route handlers and pages use separate bundles). */
export function fakeStore(): FakeStore {
  const g = globalThis as unknown as { __vouchFakePaystack?: FakeStore };
  g.__vouchFakePaystack ??= { charges: new Map(), transfers: new Map() };
  return g.__vouchFakePaystack;
}

export function isFakePaystack() {
  return fake();
}
