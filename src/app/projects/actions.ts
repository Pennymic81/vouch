"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { milestone, project } from "@/db/schema";
import { getSession } from "@/lib/session";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean } | undefined;

// ── Validation ────────────────────────────────────────────────────

const projectSchema = z.object({
  title: z.string().trim().min(3, "Give your project a short name (at least 3 characters).").max(100, "Keep the name under 100 characters."),
  idea: z.string().trim().min(20, "Tell us a little more — at least 20 characters.").max(5000, "Please keep this under 5,000 characters."),
});

const milestoneSchema = z.object({
  title: z.string().trim().min(3, "Name this milestone (at least 3 characters).").max(120, "Keep the name under 120 characters."),
  criteria: z
    .string()
    .transform((s) => s.split("\n").map((l) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean))
    .pipe(
      z
        .array(z.string().max(300, "Each line must be under 300 characters."))
        .min(1, "Add at least one line describing what “done” means.")
        .max(10, "Use at most 10 lines."),
    ),
  amount: z.coerce.number({ error: "Enter an amount." }).int("Use a whole number.").min(1, "The amount must be at least 1.").max(1_000_000, "That amount is too large."),
  durationDays: z.coerce.number({ error: "Enter a number of days." }).int("Use whole days.").min(1, "At least 1 day.").max(365, "Split anything over a year into more milestones."),
});

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

// ── Access checks ─────────────────────────────────────────────────

async function requireClient() {
  const session = await getSession();
  if (!session || session.user.role !== "client") throw new Error("Not allowed");
  return session.user;
}

/** Returns the project only if it belongs to the current business owner. */
async function ownedProject(projectId: string) {
  const user = await requireClient();
  const [p] = await db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.clientId, user.id)))
    .limit(1);
  if (!p) throw new Error("Project not found");
  return p;
}

/** Plans can only be edited while they are still drafts. */
async function editableProject(projectId: string) {
  const p = await ownedProject(projectId);
  if (p.status !== "draft") throw new Error("This plan is already published and can't be edited.");
  return p;
}

async function ownedMilestone(milestoneId: string) {
  const [m] = await db.select().from(milestone).where(eq(milestone.id, milestoneId)).limit(1);
  if (!m) throw new Error("Milestone not found");
  const p = await editableProject(m.projectId);
  return { m, p };
}

async function touch(projectId: string) {
  await db.update(project).set({ updatedAt: new Date() }).where(eq(project.id, projectId));
}

// ── Actions ───────────────────────────────────────────────────────

export async function createProject(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireClient();
  const parsed = projectSchema.safeParse({ title: formData.get("title"), idea: formData.get("idea") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const id = crypto.randomUUID();
  await db.insert(project).values({ id, clientId: user.id, ...parsed.data });
  redirect(`/projects/${id}/plan`);
}

export async function updateProjectDetails(projectId: string, _: FormState, formData: FormData): Promise<FormState> {
  await editableProject(projectId);
  const parsed = projectSchema
    .extend({ summary: z.string().trim().max(600, "Keep the summary under 600 characters.").optional() })
    .safeParse({ title: formData.get("title"), idea: formData.get("idea"), summary: formData.get("summary") ?? undefined });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  await db
    .update(project)
    .set({ ...parsed.data, summary: parsed.data.summary || null, updatedAt: new Date() })
    .where(eq(project.id, projectId));
  refresh();
  return { ok: true };
}

export async function addMilestone(projectId: string, _: FormState, formData: FormData): Promise<FormState> {
  await editableProject(projectId);
  const parsed = milestoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${milestone.position}), 0) + 1` })
    .from(milestone)
    .where(eq(milestone.projectId, projectId));
  if (next > 20) return { error: "A plan can have at most 20 milestones." };

  await db.insert(milestone).values({ id: crypto.randomUUID(), projectId, position: next, ...parsed.data });
  await touch(projectId);
  refresh();
  return { ok: true };
}

export async function updateMilestone(milestoneId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { p } = await ownedMilestone(milestoneId);
  const parsed = milestoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  await db.update(milestone).set({ ...parsed.data, updatedAt: new Date() }).where(eq(milestone.id, milestoneId));
  await touch(p.id);
  refresh();
  return { ok: true };
}

export async function deleteMilestone(milestoneId: string) {
  const { p } = await ownedMilestone(milestoneId);
  await db.delete(milestone).where(eq(milestone.id, milestoneId));
  await renumber(p.id);
  await touch(p.id);
  refresh();
}

export async function moveMilestone(milestoneId: string, direction: "up" | "down") {
  const { m, p } = await ownedMilestone(milestoneId);
  const all = await db.select().from(milestone).where(eq(milestone.projectId, p.id)).orderBy(asc(milestone.position));
  const i = all.findIndex((x) => x.id === m.id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  db.transaction((tx) => {
    all.forEach((x, k) => tx.update(milestone).set({ position: k + 1 }).where(eq(milestone.id, x.id)).run());
  });
  await touch(p.id);
  refresh();
}

async function renumber(projectId: string) {
  const all = await db.select().from(milestone).where(eq(milestone.projectId, projectId)).orderBy(asc(milestone.position));
  db.transaction((tx) => {
    all.forEach((x, k) => tx.update(milestone).set({ position: k + 1 }).where(eq(milestone.id, x.id)).run());
  });
}

export async function publishProject(projectId: string): Promise<FormState> {
  const p = await editableProject(projectId);
  const ms = await db.select({ id: milestone.id }).from(milestone).where(eq(milestone.projectId, p.id));
  if (ms.length === 0) return { error: "Add at least one milestone before finding a developer." };

  await db.update(project).set({ status: "open", updatedAt: new Date() }).where(eq(project.id, p.id));
  redirect(`/projects/${p.id}/matches`);
}

export async function deleteProject(projectId: string) {
  const p = await editableProject(projectId);
  await db.delete(project).where(eq(project.id, p.id));
  redirect("/projects");
}
