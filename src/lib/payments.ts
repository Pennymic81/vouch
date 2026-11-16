import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activity, milestone, payment, payout, payoutAccount, project, type Milestone, type Payout, type Project } from "@/db/schema";
import { formatMoney, fromMinor, toMinor } from "./currency";
import { DeliveryError, assertCanFund, fundMilestone } from "./delivery";
import {
  PaystackError,
  createRecipient,
  initiateTransfer,
  initializeTransaction,
  paymentsEnabled,
  resolveAccount,
  verifyTransaction,
  verifyTransfer,
} from "./paystack";
import { appUrl, platformFeePercent } from "./settings";

async function log(projectId: string, message: string) {
  await db.insert(activity).values({ id: crypto.randomUUID(), projectId, message });
}

// ── Funding a milestone ───────────────────────────────────────────

/**
 * Starts funding. With Paystack on, returns the checkout link to send the owner to.
 * With payments simulated, funds immediately and returns null.
 */
export async function startFunding(milestoneId: string, client: { id: string; email: string }): Promise<string | null> {
  const { m, p } = await assertCanFund(milestoneId, client.id);

  if (!paymentsEnabled()) {
    await fundMilestone(m.id, client.id);
    return null;
  }

  const reference = `vouch_${crypto.randomUUID().replace(/-/g, "")}`;
  await db.insert(payment).values({ id: reference, milestoneId: m.id, clientId: client.id, amount: m.amount, currency: p.currency });
  try {
    const { authorizationUrl } = await initializeTransaction({
      email: client.email,
      amountMinor: toMinor(m.amount),
      currency: p.currency,
      reference,
      callbackUrl: `${appUrl()}/payments/paystack/callback`,
      metadata: { milestoneId: m.id, projectId: p.id },
    });
    return authorizationUrl;
  } catch (err) {
    await db.update(payment).set({ status: "failed", updatedAt: new Date() }).where(eq(payment.id, reference));
    if (err instanceof PaystackError) throw new DeliveryError("We couldn't start the payment. Please try again in a moment.");
    throw err;
  }
}

export type ConfirmResult = { projectId: string; outcome: "funded" | "already" | "failed" | "pending" };

/**
 * Confirms a payment with Paystack's servers and, if it really succeeded for the right amount,
 * funds the milestone. Safe to call many times (return link, webhook, page refresh).
 */
export async function confirmPayment(reference: string): Promise<ConfirmResult | null> {
  const [row] = await db
    .select({ pay: payment, m: milestone })
    .from(payment)
    .innerJoin(milestone, eq(milestone.id, payment.milestoneId))
    .where(eq(payment.id, reference))
    .limit(1);
  if (!row) return null;
  const { pay, m } = row;
  if (pay.status === "success") return { projectId: m.projectId, outcome: "already" };

  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch (err) {
    if (err instanceof PaystackError) return { projectId: m.projectId, outcome: "pending" };
    throw err;
  }

  if (tx.status !== "success") {
    if (tx.status === "failed" || tx.status === "abandoned") {
      await db.update(payment).set({ status: tx.status, updatedAt: new Date() }).where(eq(payment.id, pay.id));
      return { projectId: m.projectId, outcome: "failed" };
    }
    return { projectId: m.projectId, outcome: "pending" };
  }

  // Never trust the browser: the amount and currency must match what we asked for.
  if (tx.amountMinor !== toMinor(pay.amount) || tx.currency !== pay.currency) {
    console.error("[payments] amount mismatch", reference, tx.amountMinor, tx.currency);
    await db.update(payment).set({ status: "failed", updatedAt: new Date() }).where(eq(payment.id, pay.id));
    await log(m.projectId, `A payment for milestone ${m.position} didn't match the expected amount and was not applied. Contact support.`);
    return { projectId: m.projectId, outcome: "failed" };
  }

  // Claim the payment first so two simultaneous confirmations can't both fund.
  const claimed = await db
    .update(payment)
    .set({ status: "success", channel: tx.channel, paidAt: new Date(), updatedAt: new Date() })
    .where(and(eq(payment.id, pay.id), eq(payment.status, "pending")))
    .returning({ id: payment.id });
  if (claimed.length === 0) return { projectId: m.projectId, outcome: "already" };

  try {
    await fundMilestone(m.id, pay.clientId, ` — paid ${formatMoney(fromMinor(tx.amountMinor), tx.currency)} via Paystack`);
  } catch (err) {
    if (!(err instanceof DeliveryError)) throw err;
    // Paid, but the milestone can no longer be funded (e.g. paid twice). Flag it for a refund.
    await log(m.projectId, `Payment ${reference} was received but milestone ${m.position} couldn't be funded (${err.message}). Vouch support will refund it.`);
  }
  return { projectId: m.projectId, outcome: "funded" };
}

// ── Paying the developer ──────────────────────────────────────────

export function splitFee(gross: number) {
  const fee = Math.round((gross * platformFeePercent()) / 100);
  return { gross, fee, net: gross - fee };
}

/** Called when a milestone is approved (or auto-approved). Creates the payout once and tries to send it. */
export async function releasePayout(m: Milestone, p: Project) {
  if (!paymentsEnabled() || !p.developerId) return;
  const { gross, fee, net } = splitFee(m.amount);
  const id = `vouchpay_${crypto.randomUUID().replace(/-/g, "")}`;
  const inserted = await db
    .insert(payout)
    .values({ id, milestoneId: m.id, developerId: p.developerId, gross, fee, net, currency: p.currency, status: "awaiting_bank_details" })
    .onConflictDoNothing({ target: payout.milestoneId })
    .returning();
  if (inserted.length) await sendPayout(inserted[0]);
}

async function sendPayout(po: Payout) {
  const [account] = await db.select().from(payoutAccount).where(eq(payoutAccount.userId, po.developerId)).limit(1);
  const [m] = await db.select().from(milestone).where(eq(milestone.id, po.milestoneId)).limit(1);
  if (!account) {
    if (m) await log(m.projectId, `Payout for milestone ${m.position} is waiting for the developer's bank details`);
    return;
  }

  // Claim it so a payout is never sent twice.
  const claimed = await db
    .update(payout)
    .set({ status: "processing", updatedAt: new Date() })
    .where(and(eq(payout.id, po.id), inArray(payout.status, ["awaiting_bank_details", "failed"])))
    .returning({ id: payout.id });
  if (claimed.length === 0) return;

  try {
    const result = await initiateTransfer({
      amountMinor: toMinor(po.net),
      currency: po.currency,
      recipientCode: account.recipientCode,
      reference: po.id,
      reason: m ? `Vouch milestone ${m.position}: ${m.title}`.slice(0, 100) : "Vouch milestone payout",
    });
    await applyTransferStatus(po.id, result.status, result.transferCode, result.reason);
  } catch (err) {
    const reason = err instanceof PaystackError ? err.message : "Transfer could not be started";
    await db.update(payout).set({ status: "failed", failureReason: reason, updatedAt: new Date() }).where(eq(payout.id, po.id));
    if (!(err instanceof PaystackError)) throw err;
  }
}

/** Maps Paystack's transfer status onto ours (from the transfer call, a webhook or a check). */
export async function applyTransferStatus(reference: string, status: string, transferCode?: string | null, reason?: string) {
  const [po] = await db.select().from(payout).where(eq(payout.id, reference)).limit(1);
  if (!po || po.status === "success") return;
  const [m] = await db.select().from(milestone).where(eq(milestone.id, po.milestoneId)).limit(1);
  const now = new Date();
  if (status === "success") {
    await db.update(payout).set({ status: "success", transferCode: transferCode ?? po.transferCode, sentAt: now, failureReason: null, updatedAt: now }).where(eq(payout.id, po.id));
    if (m) await log(m.projectId, `${formatMoney(po.net, po.currency)} sent to the developer's bank for milestone ${m.position}`);
  } else if (status === "failed" || status === "reversed") {
    await db.update(payout).set({ status: "failed", transferCode: transferCode ?? po.transferCode, failureReason: reason ?? `Transfer ${status}`, updatedAt: now }).where(eq(payout.id, po.id));
  } else {
    await db.update(payout).set({ status: "processing", transferCode: transferCode ?? po.transferCode, updatedAt: now }).where(eq(payout.id, po.id));
  }
}

/** Re-checks transfers that are still on their way. */
export async function refreshPayouts(developerId: string) {
  if (!paymentsEnabled()) return;
  const open = await db.select().from(payout).where(and(eq(payout.developerId, developerId), eq(payout.status, "processing")));
  for (const po of open) {
    try {
      const r = await verifyTransfer(po.id);
      await applyTransferStatus(po.id, r.status, r.transferCode, r.reason);
    } catch (err) {
      if (!(err instanceof PaystackError)) throw err;
    }
  }
}

// ── Developer bank account ────────────────────────────────────────

export async function checkBankAccount(accountNumber: string, bankCode: string) {
  return resolveAccount(accountNumber, bankCode);
}

export async function saveBankAccount(
  developerId: string,
  input: { accountNumber: string; bankCode: string; bankName: string; currency: string },
) {
  const { accountName } = await resolveAccount(input.accountNumber, input.bankCode);
  const { recipientCode } = await createRecipient({ name: accountName, accountNumber: input.accountNumber, bankCode: input.bankCode, currency: input.currency });
  const values = {
    bankCode: input.bankCode,
    bankName: input.bankName,
    accountName,
    last4: input.accountNumber.slice(-4),
    recipientCode,
    currency: input.currency,
    updatedAt: new Date(),
  };
  await db.insert(payoutAccount).values({ userId: developerId, ...values }).onConflictDoUpdate({ target: payoutAccount.userId, set: values });

  // Anything that was waiting for bank details (or failed) goes out now.
  const waiting = await db
    .select()
    .from(payout)
    .where(and(eq(payout.developerId, developerId), inArray(payout.status, ["awaiting_bank_details", "failed"])));
  for (const po of waiting) await sendPayout(po);
  return { accountName };
}

export async function getPayoutAccount(developerId: string) {
  const [a] = await db.select().from(payoutAccount).where(eq(payoutAccount.userId, developerId)).limit(1);
  return a ?? null;
}

export async function listPayouts(developerId: string) {
  return db
    .select({ po: payout, m: milestone, title: project.title })
    .from(payout)
    .innerJoin(milestone, eq(milestone.id, payout.milestoneId))
    .innerJoin(project, eq(project.id, milestone.projectId))
    .where(eq(payout.developerId, developerId))
    .orderBy(desc(payout.createdAt));
}

export async function payoutsForProject(projectId: string) {
  return db
    .select({ po: payout })
    .from(payout)
    .innerJoin(milestone, eq(milestone.id, payout.milestoneId))
    .where(eq(milestone.projectId, projectId));
}
