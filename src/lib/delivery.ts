import "server-only";
import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  activity,
  milestone,
  project,
  qaReview,
  submission,
  user,
  type Milestone,
  type Project,
  type QaCheck,
} from "@/db/schema";

/**
 * Milestone lifecycle (payments are simulated until step 7):
 *
 *   planned ──fund──▶ funded ──submit──▶ in_qa ──QA pass──▶ awaiting_approval ──approve / auto──▶ paid
 *                        ▲                 │                        │
 *                        │              QA fail            owner requests changes
 *                        │                 ▼                        │
 *                        └──── changes_requested ◀──────────────────┘   (developer resubmits → in_qa)
 *
 * Only one milestone is active at a time, and they are worked on in order.
 */

export class DeliveryError extends Error {}

const ACTIVE: Milestone["status"][] = ["funded", "in_progress", "in_qa", "awaiting_approval", "changes_requested"];

export function reviewWindowDays() {
  const n = Number(process.env.REVIEW_WINDOW_DAYS);
  return Number.isFinite(n) && n > 0 ? n : 5;
}

export function autoApproveAt(m: Pick<Milestone, "qaPassedAt">) {
  return m.qaPassedAt ? new Date(m.qaPassedAt.getTime() + reviewWindowDays() * 86_400_000) : null;
}

/**
 * Vouch QA reviewers are staff listed in REVIEWER_EMAILS (comma-separated).
 * An entry like "*@vouch.com" allows everyone on that domain.
 */
export function isReviewer(email: string | null | undefined) {
  if (!email) return false;
  const e = email.toLowerCase();
  return (process.env.REVIEWER_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => (rule.startsWith("*@") ? e.endsWith(rule.slice(1)) : e === rule));
}

async function log(projectId: string, message: string) {
  await db.insert(activity).values({ id: crypto.randomUUID(), projectId, message });
}

async function loadMilestone(milestoneId: string) {
  const [row] = await db
    .select({ m: milestone, p: project })
    .from(milestone)
    .innerJoin(project, eq(project.id, milestone.projectId))
    .where(eq(milestone.id, milestoneId))
    .limit(1);
  if (!row) throw new DeliveryError("Milestone not found.");
  return row;
}

async function nameOf(userId: string | null) {
  if (!userId) return "The developer";
  const [u] = await db.select({ name: user.name }).from(user).where(eq(user.id, userId)).limit(1);
  return u?.name.split(" ")[0] ?? "The developer";
}

// ── Owner actions ─────────────────────────────────────────────────

/** Checks a milestone can be funded right now, and returns it. Used before checkout and again after payment. */
export async function assertCanFund(milestoneId: string, clientId: string) {
  const { m, p } = await loadMilestone(milestoneId);
  if (p.clientId !== clientId) throw new DeliveryError("Milestone not found.");
  if (p.status !== "in_progress") throw new DeliveryError("Choose a developer before funding milestones.");
  if (m.status !== "planned") throw new DeliveryError("This milestone is already funded.");

  const all = await db.select().from(milestone).where(eq(milestone.projectId, p.id)).orderBy(asc(milestone.position));
  if (all.some((x) => ACTIVE.includes(x.status))) throw new DeliveryError("Finish the current milestone before funding the next one.");
  const next = all.find((x) => x.status === "planned");
  if (next?.id !== m.id) throw new DeliveryError("Milestones are funded in order.");
  return { m, p };
}

export async function fundMilestone(milestoneId: string, clientId: string, via = "") {
  const { m, p } = await assertCanFund(milestoneId, clientId);
  await db.update(milestone).set({ status: "funded", fundedAt: new Date(), updatedAt: new Date() }).where(eq(milestone.id, m.id));
  await log(p.id, `You funded milestone ${m.position} · ${m.title}${via}`);
}

export async function approveMilestone(milestoneId: string, clientId: string) {
  const { m, p } = await loadMilestone(milestoneId);
  if (p.clientId !== clientId) throw new DeliveryError("Milestone not found.");
  if (m.status !== "awaiting_approval") throw new DeliveryError("This milestone isn't waiting for your approval.");
  await markPaid(m, p, false);
}

export async function requestOwnerChanges(milestoneId: string, clientId: string, note: string) {
  const { m, p } = await loadMilestone(milestoneId);
  if (p.clientId !== clientId) throw new DeliveryError("Milestone not found.");
  if (m.status !== "awaiting_approval") throw new DeliveryError("This milestone isn't waiting for your approval.");
  await db
    .update(milestone)
    .set({ status: "changes_requested", ownerFeedback: note, qaPassedAt: null, updatedAt: new Date() })
    .where(eq(milestone.id, m.id));
  await log(p.id, `You asked for changes on milestone ${m.position}`);
}

async function markPaid(m: Milestone, p: Project, auto: boolean) {
  const now = new Date();
  await db
    .update(milestone)
    .set({ status: "paid", paidAt: now, autoApproved: auto, ownerFeedback: null, updatedAt: now })
    .where(eq(milestone.id, m.id));
  const dev = await nameOf(p.developerId);
  await log(
    p.id,
    auto
      ? `Milestone ${m.position} was approved automatically after the review window — payment released to ${dev}`
      : `You approved milestone ${m.position} — payment released to ${dev}`,
  );
  // Send the developer their share (no-op when payments are simulated).
  const { releasePayout } = await import("./payments");
  await releasePayout(m, p);

  const remaining = await db
    .select({ id: milestone.id })
    .from(milestone)
    .where(and(eq(milestone.projectId, p.id), inArray(milestone.status, ["planned", ...ACTIVE])));
  if (remaining.length === 0) {
    await db.update(project).set({ status: "completed", updatedAt: now }).where(eq(project.id, p.id));
    await log(p.id, "Every milestone is done — project completed 🎉");
  }
}

/** Approves anything whose review window has passed. Runs whenever a project is viewed. */
export async function runAutoApprovals(projectId: string) {
  const cutoff = new Date(Date.now() - reviewWindowDays() * 86_400_000);
  const due = await db
    .select({ m: milestone, p: project })
    .from(milestone)
    .innerJoin(project, eq(project.id, milestone.projectId))
    .where(and(eq(milestone.projectId, projectId), eq(milestone.status, "awaiting_approval"), lt(milestone.qaPassedAt, cutoff)));
  for (const { m, p } of due) await markPaid(m, p, true);
}

// ── Developer actions ─────────────────────────────────────────────

export async function submitMilestone(milestoneId: string, developerId: string, note: string, demoUrl: string) {
  const { m, p } = await loadMilestone(milestoneId);
  if (p.developerId !== developerId) throw new DeliveryError("Milestone not found.");
  if (m.status !== "funded" && m.status !== "in_progress" && m.status !== "changes_requested") {
    throw new DeliveryError(
      m.status === "planned" ? "Wait until the owner funds this milestone." : "This milestone has already been handed in.",
    );
  }
  const previous = await db.select({ round: submission.round }).from(submission).where(eq(submission.milestoneId, m.id));
  const round = previous.length + 1;
  const now = new Date();
  await db.insert(submission).values({ id: crypto.randomUUID(), milestoneId: m.id, developerId, round, note, demoUrl });
  await db.update(milestone).set({ status: "in_qa", submittedAt: now, updatedAt: now }).where(eq(milestone.id, m.id));
  await log(p.id, `${await nameOf(developerId)} submitted milestone ${m.position} for QA${round > 1 ? ` (round ${round})` : ""}`);
}

// ── Reviewer actions ──────────────────────────────────────────────

export async function reviewMilestone(
  milestoneId: string,
  reviewer: { id: string; email: string },
  checks: QaCheck[],
  summary: string,
) {
  if (!isReviewer(reviewer.email)) throw new DeliveryError("Only Vouch QA reviewers can do this.");
  const { m, p } = await loadMilestone(milestoneId);
  if (reviewer.id === p.clientId || reviewer.id === p.developerId) {
    throw new DeliveryError("You can't review a project you're part of.");
  }
  if (m.status !== "in_qa") throw new DeliveryError("This milestone isn't waiting for QA.");

  // Every agreed check must be reviewed — no more, no fewer.
  const expected = m.criteria;
  if (checks.length !== expected.length || checks.some((c, i) => c.criterion !== expected[i])) {
    throw new DeliveryError("Review every check on the list.");
  }
  if (checks.some((c) => !c.passed && !c.note?.trim())) {
    throw new DeliveryError("Explain what's wrong for every check that fails.");
  }

  const [latest] = await db
    .select()
    .from(submission)
    .where(eq(submission.milestoneId, m.id))
    .orderBy(desc(submission.round))
    .limit(1);
  if (!latest) throw new DeliveryError("Nothing has been submitted yet.");

  const passed = checks.every((c) => c.passed);
  const now = new Date();
  await db.insert(qaReview).values({ id: crypto.randomUUID(), submissionId: latest.id, reviewerId: reviewer.id, checks, passed, summary });
  await db
    .update(milestone)
    .set(
      passed
        ? { status: "awaiting_approval", qaPassedAt: now, ownerFeedback: null, updatedAt: now }
        : { status: "changes_requested", ownerFeedback: null, updatedAt: now },
    )
    .where(eq(milestone.id, m.id));
  const passedCount = checks.filter((c) => c.passed).length;
  await log(
    p.id,
    passed
      ? `QA passed milestone ${m.position} — ${passedCount} of ${checks.length} checks`
      : `QA found issues on milestone ${m.position} — ${passedCount} of ${checks.length} checks passed`,
  );
}

// ── Reading ───────────────────────────────────────────────────────

export type MilestoneDetail = Milestone & {
  latest: { round: number; note: string; demoUrl: string; createdAt: Date } | null;
  review: { checks: QaCheck[]; passed: boolean; summary: string; createdAt: Date } | null;
};

/** Milestones with their latest submission and that submission's QA review. */
export async function milestoneDetails(projectId: string): Promise<MilestoneDetail[]> {
  const ms = await db.select().from(milestone).where(eq(milestone.projectId, projectId)).orderBy(asc(milestone.position));
  if (ms.length === 0) return [];
  const subs = await db
    .select({ s: submission, r: qaReview })
    .from(submission)
    .leftJoin(qaReview, eq(qaReview.submissionId, submission.id))
    .where(inArray(submission.milestoneId, ms.map((m) => m.id)))
    .orderBy(desc(submission.round));
  return ms.map((m) => {
    const row = subs.find((x) => x.s.milestoneId === m.id);
    return {
      ...m,
      latest: row ? { round: row.s.round, note: row.s.note, demoUrl: row.s.demoUrl, createdAt: row.s.createdAt } : null,
      review: row?.r ? { checks: row.r.checks, passed: row.r.passed, summary: row.r.summary, createdAt: row.r.createdAt } : null,
    };
  });
}

export async function recentActivity(projectId: string, limit = 12) {
  return db.select().from(activity).where(eq(activity.projectId, projectId)).orderBy(desc(activity.createdAt)).limit(limit);
}

/** Everything waiting for QA, oldest first. */
export async function qaQueue() {
  return db
    .select({ m: milestone, p: project })
    .from(milestone)
    .innerJoin(project, eq(project.id, milestone.projectId))
    .where(eq(milestone.status, "in_qa"))
    .orderBy(asc(milestone.submittedAt));
}

export async function loadForReview(milestoneId: string) {
  const { m, p } = await loadMilestone(milestoneId);
  const [detail] = (await milestoneDetails(p.id)).filter((x) => x.id === m.id);
  return { m: detail, p };
}
