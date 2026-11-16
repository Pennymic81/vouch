import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { isReviewer } from "@/lib/delivery";
import { getSession } from "@/lib/session";

async function Gate({ returnTo, children }: { returnTo: string; children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  if (!isReviewer(session.user.email)) notFound();
  return <>{children}</>;
}

/** Only Vouch QA reviewers (REVIEWER_EMAILS) can see these pages; everyone else gets a 404. */
export function ReviewerOnly({ returnTo, children }: { returnTo: string; children: ReactNode }) {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto mt-10 h-64 w-full max-w-[1100px] animate-pulse rounded-[18px] bg-white" />}>
      <Gate returnTo={returnTo}>{children}</Gate>
    </Suspense>
  );
}
