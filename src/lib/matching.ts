import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { developerProfile, invitation, proof, user, type DeveloperProfile, type Invitation, type Proof } from "@/db/schema";

/**
 * How a developer is scored against a project (0–100):
 *  - up to 50 for listing the skills the project needs
 *  - up to 40 for shipped work (proof) that shows those skills
 *  - up to 10 for depth: more than one relevant piece of proof
 * Only developers who are available and have at least one piece of proof are matched.
 */
export const MIN_SCORE = 25;

export type MatchExplanation = {
  score: number;
  why: string[];
  gaps: string[];
  relevantProof: Pick<Proof, "id" | "title" | "url">[];
};

export function scoreDeveloper(
  projectSkills: string[],
  profile: Pick<DeveloperProfile, "skills">,
  proofs: Pick<Proof, "id" | "title" | "url" | "skills">[],
): MatchExplanation {
  const needed = [...new Set(projectSkills)];
  if (needed.length === 0) return { score: 0, why: [], gaps: [], relevantProof: [] };

  const listed = needed.filter((s) => profile.skills.includes(s));
  const shownBy = new Map<string, (typeof proofs)[number]>();
  for (const skill of needed) {
    const p = proofs.find((x) => x.skills.includes(skill));
    if (p) shownBy.set(skill, p);
  }
  const relevantProof = proofs.filter((p) => p.skills.some((s) => needed.includes(s)));

  const skillPart = (listed.length / needed.length) * 50;
  const proofPart = (shownBy.size / needed.length) * 40;
  const depthPart = Math.min(relevantProof.length, 3) >= 2 ? 10 : relevantProof.length === 1 ? 5 : 0;
  const score = Math.round(skillPart + proofPart + depthPart);

  const why: string[] = [];
  const byProof = new Map<string, string[]>();
  for (const [skill, p] of shownBy) byProof.set(p.title, [...(byProof.get(p.title) ?? []), skill]);
  for (const [title, skills] of byProof) why.push(`Shipped “${title}” — shows ${joinList(skills)}`);
  const listedOnly = listed.filter((s) => !shownBy.has(s));
  if (listedOnly.length) why.push(`Also lists ${joinList(listedOnly)}`);

  const missing = needed.filter((s) => !listed.includes(s) && !shownBy.has(s));
  const unproven = listed.filter((s) => !shownBy.has(s));
  const gaps: string[] = [];
  if (missing.length) gaps.push(`No ${joinList(missing)} experience yet`);
  if (unproven.length) gaps.push(`No shipped work showing ${joinList(unproven)}`);

  return { score: Math.min(100, score), why, gaps, relevantProof: relevantProof.map(({ id, title, url }) => ({ id, title, url })) };
}

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

export type Match = MatchExplanation & {
  developerId: string;
  name: string;
  headline: string;
  location: string;
  hourlyRate: number;
  invitationStatus: Invitation["status"] | null;
};

/** Ranks every available developer with proof for this project, best first. */
export async function findMatches(projectId: string, projectSkills: string[], limit = 10): Promise<Match[]> {
  // Callers pass a larger limit to "show all".
  const devs = await db
    .select({ profile: developerProfile, name: user.name })
    .from(developerProfile)
    .innerJoin(user, eq(user.id, developerProfile.userId))
    .where(and(eq(developerProfile.available, true), eq(user.role, "developer")));
  if (devs.length === 0) return [];

  const ids = devs.map((d) => d.profile.userId);
  const proofs = await db.select().from(proof).where(inArray(proof.userId, ids));
  const invites = await db
    .select({ developerId: invitation.developerId, status: invitation.status })
    .from(invitation)
    .where(eq(invitation.projectId, projectId));

  return devs
    .map((d) => {
      const theirProof = proofs.filter((p) => p.userId === d.profile.userId);
      if (theirProof.length === 0) return null;
      const result = scoreDeveloper(projectSkills, d.profile, theirProof);
      return {
        ...result,
        developerId: d.profile.userId,
        name: d.name,
        headline: d.profile.headline,
        location: d.profile.location,
        hourlyRate: d.profile.hourlyRate,
        invitationStatus: invites.find((i) => i.developerId === d.profile.userId)?.status ?? null,
      };
    })
    .filter((m): m is Match => !!m && m.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || a.hourlyRate - b.hourlyRate)
    // Anyone already invited always stays visible, even beyond the limit.
    .filter((m, i) => i < limit || m.invitationStatus !== null);
}
