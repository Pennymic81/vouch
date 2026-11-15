import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { db } from "@/db";
import * as schema from "@/db/schema";

const ROLES = ["client", "developer"] as const;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      // Chosen once at sign-up; decides which side of Vouch the person sees.
      role: { type: ["client", "developer"], required: true, defaultValue: "client", input: true },
      company: { type: "string", required: false, input: true },
      portfolioUrl: { type: "string", required: false, input: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === "production" && !process.env.E2E,
    window: 60,
    max: 20,
  },
  databaseHooks: {
    user: {
      create: {
        // Never trust the browser: only the two real roles are allowed.
        before: async (user) => {
          if (!ROLES.includes(user.role as (typeof ROLES)[number])) {
            throw new APIError("BAD_REQUEST", { message: "Choose whether you're a business owner or a developer." });
          }
        },
      },
      update: {
        // A role is fixed at sign-up; nobody can switch sides through the API.
        before: async (user) => {
          if ("role" in user) {
            throw new APIError("FORBIDDEN", { message: "Your account type can't be changed." });
          }
        },
      },
    },
  },
  plugins: [nextCookies()], // must stay last
});

export type Session = typeof auth.$Infer.Session;
