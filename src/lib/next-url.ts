/** Reads ?next= from the current URL, only allowing same-site paths. */
export function safeNextPath(): string | null {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** Only follow ?next= if it belongs to this role's side of the app. */
export function destinationFor(role: string | null | undefined) {
  const home = role === "developer" ? "/dashboard" : "/projects/new";
  const next = safeNextPath();
  if (!next) return home;
  const isDevPath = next.startsWith("/dashboard");
  const isClientPath = next.startsWith("/projects");
  if ((role === "developer" && isClientPath) || (role !== "developer" && isDevPath)) return home;
  return next;
}
