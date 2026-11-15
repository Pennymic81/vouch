import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { Stepper } from "@/components/stepper";
import { SkillTags } from "@/components/skill-picker";
import { Avatar, Card, Pill } from "@/components/ui";
import { Check } from "@/components/icons";
import { getSession, initialsOf } from "@/lib/session";
import { formatMoney, getProjectForClient } from "@/lib/projects";
import { findMatches } from "@/lib/matching";
import { InviteButton } from "./invite-button";

export const metadata: Metadata = { title: "Your matches" };

const PAGE_SIZE = 10;

async function Matches({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const showAll = (await searchParams).all === "1";
  const session = await getSession();
  const p = session ? await getProjectForClient(id, session.user.id) : null;
  if (!p) notFound();
  if (p.status === "draft") redirect(`/projects/${p.id}/plan`);
  if (p.status !== "open") redirect(`/projects/${p.id}`);

  const all = await findMatches(p.id, p.skills, 200);
  const matches = showAll ? all : all.filter((m, i) => i < PAGE_SIZE || m.invitationStatus !== null);
  const hidden = all.length - matches.length;

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pb-20 pt-10">
      <Stepper current={3} />
      <div className="flex flex-col gap-2">
        <Link href={`/projects/${p.id}`} className="text-[15px] font-semibold text-brand no-underline">← Back to project</Link>
        <h1 className="text-[30px] font-bold md:text-4xl">Matches for {p.title}</h1>
        <p className="text-[17px] text-body">Ranked by the skills your plan needs and the work each person has actually shipped.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 rounded-[14px] border border-line bg-white px-5 py-4 text-sm">
        <span className="mr-1.5 font-semibold text-muted">Matched against:</span>
        <SkillTags skills={p.skills} />
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-line-strong bg-white px-6 py-14 text-center">
          <h2 className="text-2xl font-bold">No matches yet</h2>
          <p className="max-w-lg text-body">
            No available developer has shipped work showing these skills yet. We&apos;ll keep looking — check back soon, as new developers join every day.
          </p>
        </div>
      ) : (
        <ol aria-label="Matches" className="flex flex-col gap-5">
          {matches.map((m, i) => (
            <li key={m.developerId}>
              <Card className="flex flex-wrap gap-7 p-6 md:p-7">
                <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar initials={initialsOf(m.name)} size="lg" />
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="text-[22px] font-bold">{m.name}</h2>
                      <span className="text-[15px] text-body">{m.headline}</span>
                      {m.location && <span className="text-sm text-muted">{m.location}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill>{m.score}% match{i === 0 ? " · Best fit" : ""}</Pill>
                    <Pill tone="neutral">{formatMoney(m.hourlyRate)}/hr</Pill>
                  </div>
                </div>

                <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
                  <h3 className="text-base font-bold text-brand-dark">Why {m.name.split(" ")[0]} fits</h3>
                  <ul className="flex flex-col gap-2.5 text-[15px] leading-normal text-body">
                    {m.why.map((w) => <li key={w} className="flex gap-2.5"><Check />{w}</li>)}
                  </ul>
                  {m.gaps.map((g) => (
                    <p key={g} className="rounded-[10px] bg-alert-soft px-3 py-2.5 text-sm text-alert-dark">{g}</p>
                  ))}
                </div>

                <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3">
                  <h3 className="text-base font-bold">Shipped work</h3>
                  {m.relevantProof.map((pr) => (
                    <a
                      key={pr.id}
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex justify-between gap-2.5 rounded-xl border border-line px-3.5 py-3 text-[15px] font-medium text-ink no-underline hover:border-line-strong"
                    >
                      <span>{pr.title}</span><span aria-hidden="true" className="text-brand">↗</span>
                    </a>
                  ))}
                  <div className="mt-auto pt-2">
                    <InviteButton projectId={p.id} developerId={m.developerId} name={m.name} status={m.invitationStatus} />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
      {hidden > 0 && (
        <Link href={`/projects/${p.id}/matches?all=1`} className="self-center rounded-xl border border-line-strong bg-white px-5 py-3 font-semibold text-ink no-underline hover:bg-ground">
          Show all {all.length} matches
        </Link>
      )}
    </main>
  );
}

export default function MatchesPage({ params, searchParams }: PageProps<"/projects/[id]/matches">) {
  return (
    <>
      <AppHeader active="projects" />
      <Protected role="client" returnTo="/projects">
        <Matches params={params} searchParams={searchParams} />
      </Protected>
    </>
  );
}
