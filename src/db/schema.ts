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
    fundedAt: integer("funded_at", { mode: "timestamp_ms" }),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
    /** When QA passed — starts the owner's review window. */
    qaPassedAt: integer("qa_passed_at", { mode: "timestamp_ms" }),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    /** True when the owner didn't respond in time and approval happened automatically. */
    autoApproved: integer("auto_approved", { mode: "boolean" }).notNull().default(false),
    /** The owner's latest "please change…" note, shown to the developer. */
    ownerFeedback: text("owner_feedback"),
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

// ── Delivery & QA (step 6) ────────────────────────────────────────

/** Each time a developer hands in a milestone (first try or after changes). */
export const submission = sqliteTable(
  "submission",
  {
    id: text("id").primaryKey(),
    milestoneId: text("milestone_id")
      .notNull()
      .references(() => milestone.id, { onDelete: "cascade" }),
    developerId: text("developer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    round: integer("round").notNull(),
    note: text("note").notNull(),
    demoUrl: text("demo_url").notNull(),
    ...timestamps,
  },
  (t) => [index("submission_milestone_idx").on(t.milestoneId)],
);

export type QaCheck = { criterion: string; passed: boolean; note?: string };

/** A reviewer's verdict on one submission, criterion by criterion. */
export const qaReview = sqliteTable(
  "qa_review",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id")
      .notNull()
      .references(() => submission.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    checks: text("checks", { mode: "json" }).$type<QaCheck[]>().notNull(),
    passed: integer("passed", { mode: "boolean" }).notNull(),
    summary: text("summary").notNull().default(""),
    ...timestamps,
  },
  (t) => [uniqueIndex("qa_review_submission_idx").on(t.submissionId)],
);

/** What happened on a project, newest first in the workspace. */
export const activity = sqliteTable(
  "activity",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    ...timestamps,
  },
  (t) => [index("activity_project_idx").on(t.projectId)],
);

export type Submission = typeof submission.$inferSelect;
export type QaReview = typeof qaReview.$inferSelect;

// ── Payments (step 7, Paystack) ───────────────────────────────────

export const PAYMENT_STATUSES = ["pending", "success", "failed", "abandoned"] as const;

/** Money an owner pays in to fund one milestone (held in the Paystack balance as escrow). */
export const payment = sqliteTable(
  "payment",
  {
    /** Also the Paystack transaction reference. */
    id: text("id").primaryKey(),
    milestoneId: text("milestone_id")
      .notNull()
      .references(() => milestone.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Whole units of `currency`. */
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    status: text("status", { enum: PAYMENT_STATUSES }).notNull().default("pending"),
    channel: text("channel"),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => [index("payment_milestone_idx").on(t.milestoneId)],
);

export const PAYOUT_STATUSES = ["awaiting_bank_details", "processing", "success", "failed"] as const;

/** Money sent to a developer when a milestone is approved. */
export const payout = sqliteTable(
  "payout",
  {
    /** Also the Paystack transfer reference. */
    id: text("id").primaryKey(),
    milestoneId: text("milestone_id")
      .notNull()
      .unique()
      .references(() => milestone.id, { onDelete: "cascade" }),
    developerId: text("developer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Milestone amount, Vouch's fee, and what the developer receives. Whole units. */
    gross: integer("gross").notNull(),
    fee: integer("fee").notNull(),
    net: integer("net").notNull(),
    currency: text("currency").notNull(),
    status: text("status", { enum: PAYOUT_STATUSES }).notNull(),
    transferCode: text("transfer_code"),
    failureReason: text("failure_reason"),
    sentAt: integer("sent_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => [index("payout_developer_idx").on(t.developerId)],
);

/** A developer's bank account, saved at Paystack as a transfer recipient. Only the last 4 digits are kept here. */
export const payoutAccount = sqliteTable("payout_account", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  bankCode: text("bank_code").notNull(),
  bankName: text("bank_name").notNull(),
  accountName: text("account_name").notNull(),
  last4: text("last4").notNull(),
  recipientCode: text("recipient_code").notNull(),
  currency: text("currency").notNull(),
  ...timestamps,
});

export type Payment = typeof payment.$inferSelect;
export type Payout = typeof payout.$inferSelect;
export type PayoutAccount = typeof payoutAccount.$inferSelect;
