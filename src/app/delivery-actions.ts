"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { startFunding } from "@/lib/payments";
import {
  DeliveryError,
  approveMilestone,
  requestOwnerChanges,
  reviewMilestone,
  submitMilestone,
} from "@/lib/delivery";

export type ActionResult = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean } | undefined;

async function user(role?: "client" | "developer") {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  if (role && session.user.role !== role) throw new Error("Not allowed");
  return session.user;
}

/** Turns rule violations into friendly messages; anything else is a real bug and is rethrown. */
async function run(fn: () => Promise<void>, { refreshPage = true } = {}): Promise<ActionResult> {
  try {
    await fn();
  } catch (err) {
    if (err instanceof DeliveryError) return { error: err.message };
    throw err;
  }
  if (refreshPage) refresh();
  return { ok: true };
}

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}

// ── Owner ─────────────────────────────────────────────────────────

export async function fundAction(milestoneId: string): Promise<ActionResult> {
  const me = await user("client");
  let checkoutUrl: string | null = null;
  const result = await run(async () => {
    checkoutUrl = await startFunding(milestoneId, { id: me.id, email: me.email });
  });
  // With Paystack on, send the owner to the secure checkout page.
  if (result?.ok && checkoutUrl) redirect(checkoutUrl);
  return result;
}

export async function approveAction(milestoneId: string): Promise<ActionResult> {
  const me = await user("client");
  return run(() => approveMilestone(milestoneId, me.id));
}

const changesSchema = z.object({
  note: z.string().trim().min(10, "Tell the developer what to change (at least 10 characters).").max(2000),
});

export async function requestChangesAction(milestoneId: string, _: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await user("client");
  const parsed = changesSchema.safeParse({ note: formData.get("note") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  return run(() => requestOwnerChanges(milestoneId, me.id, parsed.data.note));
}

// ── Developer ─────────────────────────────────────────────────────

const submitSchema = z.object({
  note: z.string().trim().min(10, "Describe what you delivered (at least 10 characters).").max(3000),
  demoUrl: z
    .string()
    .trim()
    .url("Enter a full link, starting with https://")
    .refine((u) => u.startsWith("https://"), "Links must start with https://")
    .max(500),
});

export async function submitAction(milestoneId: string, _: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await user("developer");
  const parsed = submitSchema.safeParse({ note: formData.get("note"), demoUrl: formData.get("demoUrl") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  return run(() => submitMilestone(milestoneId, me.id, parsed.data.note, parsed.data.demoUrl));
}

// ── QA reviewer ───────────────────────────────────────────────────

export async function reviewAction(milestoneId: string, criteria: string[], _: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await user();
  const checks = criteria.map((criterion, i) => ({
    criterion,
    passed: formData.get(`check-${i}`) === "pass",
    decided: formData.get(`check-${i}`) === "pass" || formData.get(`check-${i}`) === "fail",
    note: String(formData.get(`note-${i}`) ?? "").trim().slice(0, 1000),
  }));
  if (checks.some((c) => !c.decided)) return { error: "Mark every check as passed or failed." };
  const summary = String(formData.get("summary") ?? "").trim().slice(0, 2000);
  const result = await run(
    () =>
      reviewMilestone(
        milestoneId,
        { id: me.id, email: me.email },
        checks.map(({ criterion, passed, note }) => ({ criterion, passed, ...(note ? { note } : {}) })),
        summary,
      ),
    { refreshPage: false },
  );
  if (result?.ok) redirect("/review"); // back to the queue for the next one
  return result;
}
