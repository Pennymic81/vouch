/**
 * One shared list of skills. Business owners' projects and developers' profiles
 * both use these exact names, so matching compares like with like.
 */
export const SKILLS = [
  "AI chatbots",
  "Knowledge base / RAG",
  "AI automations",
  "Voice AI",
  "WhatsApp integration",
  "Website chat widget",
  "Business websites",
  "Online stores",
  "Web apps",
  "Mobile apps",
  "Payments",
  "Booking & scheduling",
  "Dashboards & analytics",
  "Internal tools",
  "APIs & integrations",
  "Data & spreadsheets",
  "Email & notifications",
  "User accounts & logins",
  "Search",
  "Maps & location",
] as const;

export type Skill = (typeof SKILLS)[number];

export function isSkill(s: string): s is Skill {
  return (SKILLS as readonly string[]).includes(s);
}

/** Keeps only known skills, without duplicates, in the canonical order. */
export function cleanSkills(input: unknown): Skill[] {
  const list = Array.isArray(input) ? input.map(String) : [];
  return SKILLS.filter((s) => list.includes(s));
}
