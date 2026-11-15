import { Suspense, type ReactNode } from "react";
import type { Role } from "@/db/schema";
import { requireUser } from "@/lib/session";

async function Gate({ role, returnTo, children }: { role: Role; returnTo: string; children: ReactNode }) {
  await requireUser(role, returnTo);
  return <>{children}</>;
}

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-6 pt-10">
      <div className="h-9 w-72 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-5 w-96 max-w-full animate-pulse rounded bg-slate-100" />
      <div className="h-64 animate-pulse rounded-[18px] bg-white" />
    </div>
  );
}

/** Renders children only for a signed-in user with the given role. */
export function Protected({ role, returnTo, children }: { role: Role; returnTo: string; children: ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Gate role={role} returnTo={returnTo}>
        {children}
      </Gate>
    </Suspense>
  );
}
