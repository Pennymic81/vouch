"use server";

import { and, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { activity, developerProfile, invitation, project, proof } from "@/db/schema";
import { getSession } from "@/lib/session";
import { cleanSkills } from "@/lib/skills";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean } | undefined;

async function requireDeveloper() {
  const session = await getSession();
  if (!session || session.user.role !== "developer") throw new Error("Not allowed");
  return session.user;
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}

const blankToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const httpsUrl = z
  .string()
  .trim()
  .url("Enter a full link, starting with https://")
  .refine((u) => u.startsWith("https://"), "Links must start with https://")
  .max(500);

const profileSchema = z.object({
  headline: z.string().trim().min(5, "Add a short headline (at least 5 characters).").max(120, "Keep it under 120 characters."),
  bio: z.string().trim().max(1500, "Keep your bio under 1,500 characters."),
  location: z.string().trim().max(80),
  hourlyRate: z.preprocess(
    blankToUndefined,
    z.coerce.number({ error: "Enter your hourly rate." }).int("Use a whole number.").min(1, "Your rate must be at least 1.").max(10_000_000, "That rate is too high."),
  ),
  skills: z.array(z.string()).min(1, "Pick at least one skill.").max(10, "Pick up to 10 skills."),
});

export async function saveProfile(_: FormState, formData: FormData): Promise<FormState> {
  const me = await requireDeveloper();
  const parsed = profileSchema.safeParse({
    headline: formData.get("headline"),
    bio: formData.get("bio") ?? "",
    location: formData.get("location") ?? "",
    hourlyRate: formData.get("hourlyRate"),
    skills: cleanSkills(formData.getAll("skills")),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const values = { ...parsed.data, available: formData.get("available") === "on", updatedAt: new Date() };
  await db
    .insert(developerProfile)
    .values({ userId: me.id, ...values })
    .onConflictDoUpdate({ target: developerProfile.userId, set: values });
  refresh();
  return { ok: true };
}

const proofSchema = z.object({
  title: z.string().trim().min(3, "Name this piece of work.").max(120),
  url: httpsUrl,
  description: z.string().trim().max(600, "Keep it under 600 characters."),
  skills: z.array(z.string()).min(1, "Pick at least one skill this work shows.").max(6),
});

export async function addProof(_: FormState, formData: FormData): Promise<FormState> {
  const me = await requireDeveloper();
  const parsed = proofSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
    description: formData.get("description") ?? "",
    skills: cleanSkills(formData.getAll("skills")),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const count = (await db.select({ id: proof.id }).from(proof).where(eq(proof.userId, me.id))).length;
  if (count >= 12) return { error: "You can show up to 12 pieces of work. Remove one first." };
  await db.insert(proof).values({ id: crypto.randomUUID(), userId: me.id, ...parsed.data });
  refresh();
  return { ok: true };
}

export async function deleteProof(proofId: string) {
  const me = await requireDeveloper();
  await db.delete(proof).where(and(eq(proof.id, proofId), eq(proof.userId, me.id)));
  refresh();
}

export async function respondToInvitation(invitationId: string, accept: boolean): Promise<FormState> {
  const me = await requireDeveloper();
  const [inv] = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.id, invitationId), eq(invitation.developerId, me.id)))
    .limit(1);
  if (!inv) throw new Error("Invitation not found");
  if (inv.status !== "pending") return { error: "This invitation is no longer open." };

  if (!accept) {
    await db.update(invitation).set({ status: "declined", respondedAt: new Date(), updatedAt: new Date() }).where(eq(invitation.id, inv.id));
    redirect("/dashboard");
  }

  const [p] = await db.select().from(project).where(eq(project.id, inv.projectId)).limit(1);
  if (!p || p.status !== "open") return { error: "This project has already found a developer." };

  const now = new Date();
  db.transaction((tx) => {
    tx.update(invitation).set({ status: "accepted", respondedAt: now, updatedAt: now }).where(eq(invitation.id, inv.id)).run();
    // Everyone else who was invited is told the role is filled.
    tx.update(invitation)
      .set({ status: "withdrawn", respondedAt: now, updatedAt: now })
      .where(and(eq(invitation.projectId, p.id), ne(invitation.id, inv.id), eq(invitation.status, "pending")))
      .run();
    tx.update(project).set({ status: "in_progress", developerId: me.id, updatedAt: now }).where(eq(project.id, p.id)).run();
    tx.insert(activity).values({ id: crypto.randomUUID(), projectId: p.id, message: `${me.name.split(" ")[0]} accepted your plan and joined the project` }).run();
  });
  redirect(`/dashboard/invitations/${inv.id}`);
}

// ── Payouts (step 7) ──────────────────────────────────────────────

const bankSchema = z.object({
  bankCode: z.string().trim().min(2, "Choose your bank.").max(20),
  accountNumber: z.string().trim().regex(/^\d{10}$/, "Enter your 10-digit account number."),
});

async function validBank(code: string) {
  const { listBanks } = await import("@/lib/paystack");
  const { appCurrency } = await import("@/lib/settings");
  const bank = (await listBanks(appCurrency())).find((b) => b.code === code);
  return bank ?? null;
}

export type BankState = (FormState & { accountName?: string; accountNumber?: string; bankCode?: string }) | undefined;

/** Step 1: ask the bank for the account holder's name so the developer can confirm it. */
export async function checkBankAction(_: BankState, formData: FormData): Promise<BankState> {
  await requireDeveloper();
  const parsed = bankSchema.safeParse({ bankCode: formData.get("bankCode"), accountNumber: formData.get("accountNumber") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (!(await validBank(parsed.data.bankCode))) return { fieldErrors: { bankCode: "Choose your bank." } };
  const { PaystackError } = await import("@/lib/paystack");
  const { checkBankAccount } = await import("@/lib/payments");
  try {
    const { accountName } = await checkBankAccount(parsed.data.accountNumber, parsed.data.bankCode);
    return { accountName, ...parsed.data };
  } catch (err) {
    if (err instanceof PaystackError) return { error: "We couldn't find that account. Check the number and bank." };
    throw err;
  }
}

/** Step 2: save it (as a Paystack transfer recipient) and send any payouts that were waiting. */
export async function saveBankAction(_: BankState, formData: FormData): Promise<BankState> {
  const me = await requireDeveloper();
  const parsed = bankSchema.safeParse({ bankCode: formData.get("bankCode"), accountNumber: formData.get("accountNumber") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const bank = await validBank(parsed.data.bankCode);
  if (!bank) return { fieldErrors: { bankCode: "Choose your bank." } };
  const { PaystackError } = await import("@/lib/paystack");
  const { saveBankAccount } = await import("@/lib/payments");
  const { appCurrency } = await import("@/lib/settings");
  try {
    await saveBankAccount(me.id, { ...parsed.data, bankName: bank.name, currency: appCurrency() });
  } catch (err) {
    if (err instanceof PaystackError) return { error: "Paystack couldn't save that account. Please try again." };
    throw err;
  }
  refresh();
  return { ok: true };
}
