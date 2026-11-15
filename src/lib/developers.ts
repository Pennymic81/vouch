import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { developerProfile, invitation, milestone, project, proof, user } from "@/db/schema";

export async function getProfile(userId: string) {
  const [p] = await db.select().from(developerProfile).where(eq(developerProfile.userId, userId)).limit(1);
  return p ?? null;
}

export async function listProof(userId: string) {
  return db.select().from(proof).where(eq(proof.userId, userId)).orderBy(desc(proof.createdAt));
}

/** Invitations sent to this developer, newest first, with the project's basics. */
export async function invitationsForDeveloper(developerId: string) {
  return db
    .select({
      id: invitation.id,
      status: invitation.status,
      score: invitation.score,
      createdAt: invitation.createdAt,
      projectId: project.id,
      title: project.title,
      summary: project.summary,
      skills: project.skills,
      projectStatus: project.status,
      clientName: user.name,
      company: user.company,
    })
    .from(invitation)
    .innerJoin(project, eq(project.id, invitation.projectId))
    .innerJoin(user, eq(user.id, project.clientId))
    .where(eq(invitation.developerId, developerId))
    .orderBy(desc(invitation.createdAt));
}

/** One invitation, only for the developer it was sent to, with the full plan. */
export async function getInvitationForDeveloper(invitationId: string, developerId: string) {
  const [row] = await db
    .select({ inv: invitation, p: project, clientName: user.name, company: user.company })
    .from(invitation)
    .innerJoin(project, eq(project.id, invitation.projectId))
    .innerJoin(user, eq(user.id, project.clientId))
    .where(and(eq(invitation.id, invitationId), eq(invitation.developerId, developerId)))
    .limit(1);
  if (!row) return null;
  const milestones = await db.select().from(milestone).where(eq(milestone.projectId, row.p.id)).orderBy(asc(milestone.position));
  return { ...row, milestones };
}

/** How complete a developer's profile is, with the next things to do. */
export function profileStrength(profile: Awaited<ReturnType<typeof getProfile>>, proofCount: number) {
  const checks = [
    { done: !!profile, label: "Create your profile" },
    { done: (profile?.skills.length ?? 0) >= 2, label: "Pick at least 2 skills" },
    { done: (profile?.bio.length ?? 0) >= 60, label: "Write a short bio" },
    { done: proofCount >= 1, label: "Add your first piece of shipped work" },
    { done: proofCount >= 2, label: "Add a second piece of shipped work" },
    { done: !!profile?.available, label: "Mark yourself available" },
  ];
  const percent = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  const matchable = !!profile && profile.available && proofCount >= 1;
  return { percent, checks, matchable };
}
