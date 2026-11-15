import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import type { Role } from "@/db/schema";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Where each role lands after signing in. */
export function homeFor(role: Role) {
  return role === "developer" ? "/dashboard" : "/projects/new";
}

/**
 * Returns the signed-in user, or redirects:
 * - signed out → /signin (coming back here afterwards)
 * - wrong role → that role's own home page
 */
export async function requireUser(role: Role, returnTo: string) {
  const session = await getSession();
  if (!session) redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  const userRole = session.user.role as Role;
  if (userRole !== role) redirect(homeFor(userRole));
  return session.user;
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

export function firstNameOf(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
