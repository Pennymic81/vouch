import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { Stepper } from "@/components/stepper";
import { Avatar, ButtonLink, Card, Pill } from "@/components/ui";
import { Check } from "@/components/icons";
import { candidates } from "@/lib/data";
import { getSession } from "@/lib/session";
import { getProjectForClient } from "@/lib/projects";

export const metadata: Metadata = { title: "Your matches" };

async function Matches({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const p = session ? await getProjectForClient(id, session.user.id) : null;
  if (!p) notFound();
  if (p.status === "draft") redirect(`/projects/${p.id}/plan`);

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pb-20 pt-10">
      <Stepper current={3} />
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <Link href={`/projects/${p.id}`} className="text-[15px] font-semibold text-brand no-underline">← Back to project</Link>
          <h1 className="text-[30px] font-bold md:text-4xl">Matches for {p.title}</h1>
          <p className="text-[17px] text-body">Picked for proven work on projects like yours. Each card shows exactly why they fit.</p>
        </div>
      </div>

      <p className="rounded-[14px] border border-alert-line bg-alert-soft px-5 py-4 text-[15px] text-alert-dark">
        <strong>Preview:</strong> these are example developers. Real matching against your milestones arrives in a later step.
      </p>

      <div className="flex flex-col gap-5">
        {candidates.map((c) => (
          <Card key={c.name} className="flex flex-wrap gap-7 p-6 md:p-7">
            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
              <div className="flex items-center gap-4">
                <Avatar initials={c.initials} size="lg" />
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="text-[22px] font-bold">{c.name}</h2>
                  <span className="text-[15px] text-body">{c.role}</span>
                  <span className="text-sm text-muted">{c.where}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill>✓ Work verified by Vouch</Pill>
                <Pill tone="neutral">{c.available}</Pill>
              </div>
            </div>
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
              <h3 className="text-base font-bold text-brand-dark">Why {c.first} fits</h3>
              <ul className="flex flex-col gap-2.5 text-[15px] leading-normal text-body">
                {c.why.map((w) => <li key={w} className="flex gap-2.5"><Check />{w}</li>)}
              </ul>
              <p className="rounded-[10px] bg-alert-soft px-3 py-2.5 text-sm text-alert-dark">{c.gap}</p>
            </div>
            <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3">
              <h3 className="text-base font-bold">Shipped work</h3>
              {c.proof.map((pr) => (
                <a key={pr} href="#" className="flex justify-between gap-2.5 rounded-xl border border-line px-3.5 py-3 text-[15px] font-medium text-ink no-underline hover:border-line-strong">
                  <span>{pr}</span><span aria-hidden="true" className="text-brand">↗</span>
                </a>
              ))}
              <ButtonLink href={`/projects/${p.id}`} className="mt-auto rounded-xl py-[13px]">Invite to project</ButtonLink>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

export default function MatchesPage({ params }: PageProps<"/projects/[id]/matches">) {
  return (
    <>
      <AppHeader active="projects" />
      <Protected role="client" returnTo="/projects">
        <Matches params={params} />
      </Protected>
    </>
  );
}
