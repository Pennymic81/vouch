import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Tables used by Better Auth (users, sessions, accounts, verification tokens).
// `role` decides which side of Vouch a person sees.

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
};

export const user = sqliteTable(
  "user",
  {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["client", "developer"] }).notNull().default("client"),
  company: text("company"),
  portfolioUrl: text("portfolio_url"),
  ...timestamps,
  },
  (t) => [check("user_role_check", sql`${t.role} in ('client', 'developer')`)],
);

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export type Role = (typeof user.role.enumValues)[number];

// ── Projects (step 3) ─────────────────────────────────────────────

export const PROJECT_STATUSES = ["draft", "open", "in_progress", "completed", "cancelled"] as const;
export const MILESTONE_STATUSES = [
  "planned",
  "funded",
  "in_progress",
  "in_qa",
  "awaiting_approval",
  "changes_requested",
  "paid",
] as const;

export const project = sqliteTable(
  "project",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    idea: text("idea").notNull(),
    summary: text("summary"),
    currency: text("currency").notNull().default("USD"),
    status: text("status", { enum: PROJECT_STATUSES }).notNull().default("draft"),
    /** Skills the work needs, from lib/skills.ts — used for matching. */
    skills: text("skills", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    /** The developer who accepted the invitation, once chosen. */
    developerId: text("developer_id").references(() => user.id, { onDelete: "set null" }),
    /** How many times AI has written this plan (limits cost and abuse). */
    aiGenerations: integer("ai_generations").notNull().default(0),
    /** Clarifying questions from the last AI run, and the client's answers. */
    aiQuestions: text("ai_questions", { mode: "json" }).$type<{ question: string; answer?: string }[]>(),
    ...timestamps,
  },
  (t) => [
    index("project_client_id_idx").on(t.clientId),
    check(
      "project_status_check",
      sql`${t.status} in ('draft', 'open', 'in_progress', 'completed', 'cancelled')`,
    ),
  ],
);

export const milestone = sqliteTable(
  "milestone",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    /** What "done" means — one acceptance criterion per entry. */
    criteria: text("criteria", { mode: "json" }).$type<string[]>().notNull(),
    /** Whole units of the project's currency. */
    amount: integer("amount").notNull(),
    durationDays: integer("duration_days").notNull(),
    status: text("status", { enum: MILESTONE_STATUSES }).notNull().default("planned"),
    ...timestamps,
  },
  (t) => [
    index("milestone_project_id_idx").on(t.projectId),
    check("milestone_amount_check", sql`${t.amount} > 0`),
    check("milestone_duration_check", sql`${t.durationDays} > 0`),
  ],
);

export type Project = typeof project.$inferSelect;
export type Milestone = typeof milestone.$inferSelect;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

// ── Developers & matching (step 5) ────────────────────────────────

export const developerProfile = sqliteTable(
  "developer_profile",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    headline: text("headline").notNull(),
    bio: text("bio").notNull().default(""),
    location: text("location").notNull().default(""),
    hourlyRate: integer("hourly_rate").notNull(),
    available: integer("available", { mode: "boolean" }).notNull().default(true),
    skills: text("skills", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    ...timestamps,
  },
  (t) => [check("developer_rate_check", sql`${t.hourlyRate} > 0`)],
);

export const proof = sqliteTable(
  "proof",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description").notNull().default(""),
    skills: text("skills", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    ...timestamps,
  },
  (t) => [index("proof_user_id_idx").on(t.userId)],
);

export const INVITATION_STATUSES = ["pending", "accepted", "declined", "withdrawn"] as const;

export const invitation = sqliteTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    developerId: text("developer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", { enum: INVITATION_STATUSES }).notNull().default("pending"),
    /** Match score (0–100) when the invitation was sent. */
    score: integer("score").notNull(),
    respondedAt: integer("responded_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("invitation_project_developer_idx").on(t.projectId, t.developerId),
    index("invitation_developer_idx").on(t.developerId),
    check("invitation_status_check", sql`${t.status} in ('pending', 'accepted', 'declined', 'withdrawn')`),
  ],
);

export type DeveloperProfile = typeof developerProfile.$inferSelect;
export type Proof = typeof proof.$inferSelect;
export type Invitation = typeof invitation.$inferSelect;
