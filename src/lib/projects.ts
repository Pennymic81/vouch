import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { milestone, project, type Milestone, type Project } from "@/db/schema";

export type ProjectWithMilestones = Project & { milestones: Milestone[] };

export function totalsOf(milestones: Pick<Milestone, "amount" | "durationDays">[]) {
  return {
    amount: milestones.reduce((s, m) => s + m.amount, 0),
    days: milestones.reduce((s, m) => s + m.durationDays, 0),
    count: milestones.length,
  };
}

/** All projects a business owner has, newest first, with their milestones. */
export async function listProjectsForClient(clientId: string): Promise<ProjectWithMilestones[]> {
  const projects = await db
    .select()
    .from(project)
    .where(eq(project.clientId, clientId))
    .orderBy(desc(project.createdAt));
  if (projects.length === 0) return [];
  const ms = await db
    .select()
    .from(milestone)
    .where(inArray(milestone.projectId, projects.map((p) => p.id)))
    .orderBy(asc(milestone.position));
  return projects.map((p) => ({ ...p, milestones: ms.filter((m) => m.projectId === p.id) }));
}

/** One project, only if it belongs to this business owner. */
export async function getProjectForClient(id: string, clientId: string): Promise<ProjectWithMilestones | null> {
  const [p] = await db
    .select()
    .from(project)
    .where(and(eq(project.id, id), eq(project.clientId, clientId)))
    .limit(1);
  if (!p) return null;
  const ms = await db.select().from(milestone).where(eq(milestone.projectId, p.id)).orderBy(asc(milestone.position));
  return { ...p, milestones: ms };
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatDays(days: number) {
  if (days < 14) return `${days} day${days === 1 ? "" : "s"}`;
  const weeks = Math.round(days / 7);
  return `about ${weeks} weeks`;
}

export const projectStatusLabel: Record<Project["status"], string> = {
  draft: "Draft plan",
  open: "Finding a developer",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const milestoneStatusLabel: Record<Milestone["status"], string> = {
  planned: "Planned",
  funded: "Funded",
  in_progress: "In progress",
  in_qa: "In QA review",
  awaiting_approval: "Awaiting your approval",
  changes_requested: "Changes requested",
  paid: "✓ QA passed · Paid",
};
